const instanceOfAny = (object, constructors) => constructors.some((c) => object instanceof c);

let idbProxyableTypes;
let cursorAdvanceMethods;
// This is a function to prevent it throwing up in node environments.
function getIdbProxyableTypes() {
    return (idbProxyableTypes ||
        (idbProxyableTypes = [
            IDBDatabase,
            IDBObjectStore,
            IDBIndex,
            IDBCursor,
            IDBTransaction,
        ]));
}
// This is a function to prevent it throwing up in node environments.
function getCursorAdvanceMethods() {
    return (cursorAdvanceMethods ||
        (cursorAdvanceMethods = [
            IDBCursor.prototype.advance,
            IDBCursor.prototype.continue,
            IDBCursor.prototype.continuePrimaryKey,
        ]));
}
const cursorRequestMap = new WeakMap();
const transactionDoneMap = new WeakMap();
const transactionStoreNamesMap = new WeakMap();
const transformCache = new WeakMap();
const reverseTransformCache = new WeakMap();
function promisifyRequest(request) {
    const promise = new Promise((resolve, reject) => {
        const unlisten = () => {
            request.removeEventListener('success', success);
            request.removeEventListener('error', error);
        };
        const success = () => {
            resolve(wrap(request.result));
            unlisten();
        };
        const error = () => {
            reject(request.error);
            unlisten();
        };
        request.addEventListener('success', success);
        request.addEventListener('error', error);
    });
    promise
        .then((value) => {
        // Since cursoring reuses the IDBRequest (*sigh*), we cache it for later retrieval
        // (see wrapFunction).
        if (value instanceof IDBCursor) {
            cursorRequestMap.set(value, request);
        }
        // Catching to avoid "Uncaught Promise exceptions"
    })
        .catch(() => { });
    // This mapping exists in reverseTransformCache but doesn't doesn't exist in transformCache. This
    // is because we create many promises from a single IDBRequest.
    reverseTransformCache.set(promise, request);
    return promise;
}
function cacheDonePromiseForTransaction(tx) {
    // Early bail if we've already created a done promise for this transaction.
    if (transactionDoneMap.has(tx))
        return;
    const done = new Promise((resolve, reject) => {
        const unlisten = () => {
            tx.removeEventListener('complete', complete);
            tx.removeEventListener('error', error);
            tx.removeEventListener('abort', error);
        };
        const complete = () => {
            resolve();
            unlisten();
        };
        const error = () => {
            reject(tx.error || new DOMException('AbortError', 'AbortError'));
            unlisten();
        };
        tx.addEventListener('complete', complete);
        tx.addEventListener('error', error);
        tx.addEventListener('abort', error);
    });
    // Cache it for later retrieval.
    transactionDoneMap.set(tx, done);
}
let idbProxyTraps = {
    get(target, prop, receiver) {
        if (target instanceof IDBTransaction) {
            // Special handling for transaction.done.
            if (prop === 'done')
                return transactionDoneMap.get(target);
            // Polyfill for objectStoreNames because of Edge.
            if (prop === 'objectStoreNames') {
                return target.objectStoreNames || transactionStoreNamesMap.get(target);
            }
            // Make tx.store return the only store in the transaction, or undefined if there are many.
            if (prop === 'store') {
                return receiver.objectStoreNames[1]
                    ? undefined
                    : receiver.objectStore(receiver.objectStoreNames[0]);
            }
        }
        // Else transform whatever we get back.
        return wrap(target[prop]);
    },
    set(target, prop, value) {
        target[prop] = value;
        return true;
    },
    has(target, prop) {
        if (target instanceof IDBTransaction &&
            (prop === 'done' || prop === 'store')) {
            return true;
        }
        return prop in target;
    },
};
function replaceTraps(callback) {
    idbProxyTraps = callback(idbProxyTraps);
}
function wrapFunction(func) {
    // Due to expected object equality (which is enforced by the caching in `wrap`), we
    // only create one new func per func.
    // Edge doesn't support objectStoreNames (booo), so we polyfill it here.
    if (func === IDBDatabase.prototype.transaction &&
        !('objectStoreNames' in IDBTransaction.prototype)) {
        return function (storeNames, ...args) {
            const tx = func.call(unwrap(this), storeNames, ...args);
            transactionStoreNamesMap.set(tx, storeNames.sort ? storeNames.sort() : [storeNames]);
            return wrap(tx);
        };
    }
    // Cursor methods are special, as the behaviour is a little more different to standard IDB. In
    // IDB, you advance the cursor and wait for a new 'success' on the IDBRequest that gave you the
    // cursor. It's kinda like a promise that can resolve with many values. That doesn't make sense
    // with real promises, so each advance methods returns a new promise for the cursor object, or
    // undefined if the end of the cursor has been reached.
    if (getCursorAdvanceMethods().includes(func)) {
        return function (...args) {
            // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
            // the original object.
            func.apply(unwrap(this), args);
            return wrap(cursorRequestMap.get(this));
        };
    }
    return function (...args) {
        // Calling the original function with the proxy as 'this' causes ILLEGAL INVOCATION, so we use
        // the original object.
        return wrap(func.apply(unwrap(this), args));
    };
}
function transformCachableValue(value) {
    if (typeof value === 'function')
        return wrapFunction(value);
    // This doesn't return, it just creates a 'done' promise for the transaction,
    // which is later returned for transaction.done (see idbObjectHandler).
    if (value instanceof IDBTransaction)
        cacheDonePromiseForTransaction(value);
    if (instanceOfAny(value, getIdbProxyableTypes()))
        return new Proxy(value, idbProxyTraps);
    // Return the same value back if we're not going to transform it.
    return value;
}
function wrap(value) {
    // We sometimes generate multiple promises from a single IDBRequest (eg when cursoring), because
    // IDB is weird and a single IDBRequest can yield many responses, so these can't be cached.
    if (value instanceof IDBRequest)
        return promisifyRequest(value);
    // If we've already transformed this value before, reuse the transformed value.
    // This is faster, but it also provides object equality.
    if (transformCache.has(value))
        return transformCache.get(value);
    const newValue = transformCachableValue(value);
    // Not all types are transformed.
    // These may be primitive types, so they can't be WeakMap keys.
    if (newValue !== value) {
        transformCache.set(value, newValue);
        reverseTransformCache.set(newValue, value);
    }
    return newValue;
}
const unwrap = (value) => reverseTransformCache.get(value);

/**
 * Open a database.
 *
 * @param name Name of the database.
 * @param version Schema version.
 * @param callbacks Additional callbacks.
 */
function openDB(name, version, { blocked, upgrade, blocking, terminated } = {}) {
    const request = indexedDB.open(name, version);
    const openPromise = wrap(request);
    if (upgrade) {
        request.addEventListener('upgradeneeded', (event) => {
            upgrade(wrap(request.result), event.oldVersion, event.newVersion, wrap(request.transaction));
        });
    }
    if (blocked)
        request.addEventListener('blocked', () => blocked());
    openPromise
        .then((db) => {
        if (terminated)
            db.addEventListener('close', () => terminated());
        if (blocking)
            db.addEventListener('versionchange', () => blocking());
    })
        .catch(() => { });
    return openPromise;
}

const readMethods = ['get', 'getKey', 'getAll', 'getAllKeys', 'count'];
const writeMethods = ['put', 'add', 'delete', 'clear'];
const cachedMethods = new Map();
function getMethod(target, prop) {
    if (!(target instanceof IDBDatabase &&
        !(prop in target) &&
        typeof prop === 'string')) {
        return;
    }
    if (cachedMethods.get(prop))
        return cachedMethods.get(prop);
    const targetFuncName = prop.replace(/FromIndex$/, '');
    const useIndex = prop !== targetFuncName;
    const isWrite = writeMethods.includes(targetFuncName);
    if (
    // Bail if the target doesn't exist on the target. Eg, getAll isn't in Edge.
    !(targetFuncName in (useIndex ? IDBIndex : IDBObjectStore).prototype) ||
        !(isWrite || readMethods.includes(targetFuncName))) {
        return;
    }
    const method = async function (storeName, ...args) {
        // isWrite ? 'readwrite' : undefined gzipps better, but fails in Edge :(
        const tx = this.transaction(storeName, isWrite ? 'readwrite' : 'readonly');
        let target = tx.store;
        if (useIndex)
            target = target.index(args.shift());
        // Must reject if op rejects.
        // If it's a write operation, must reject if tx.done rejects.
        // Must reject with op rejection first.
        // Must resolve with op value.
        // Must handle both promises (no unhandled rejections)
        return (await Promise.all([
            target[targetFuncName](...args),
            isWrite && tx.done,
        ]))[0];
    };
    cachedMethods.set(prop, method);
    return method;
}
replaceTraps((oldTraps) => ({
    ...oldTraps,
    get: (target, prop, receiver) => getMethod(target, prop) || oldTraps.get(target, prop, receiver),
    has: (target, prop) => !!getMethod(target, prop) || oldTraps.has(target, prop),
}));

var Level;
(function (Level) {
    Level[Level["Error"] = 0] = "Error";
    Level[Level["Warning"] = 1] = "Warning";
    Level[Level["Info"] = 2] = "Info";
    Level[Level["success"] = 3] = "success";
})(Level || (Level = {}));
//from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid.
//cant import crypto so this should do.
//TODO keep an eye out for something better.
function generateUUID() {
    let d = new Date().getTime(); //Timestamp
    let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16; //random number between 0 and 16
        if (d > 0) { //Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        }
        else { //Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
generateUUID();
const DBVERSION = 1;
const LoggingTable = "logging";
const MetricTable = "metrics";
let loggingDB;
const getLoggingDB = function () {
    return loggingDB;
};
const initLogging = async function (ns) {
    // loggingDB = await DB.open("BBLogging",DBVERSION,createDB)
    loggingDB = await openDB("BBLogging", DBVERSION, {
        upgrade(db, prevVersion) {
            if (prevVersion < 1) {
                const loggingStore = db.createObjectStore(LoggingTable, { autoIncrement: true });
                loggingStore.createIndex("timestamp", "timestamp", { unique: false });
                const metricStore = db.createObjectStore(MetricTable, { autoIncrement: true });
                metricStore.createIndex("timestamp", "timestamp", { unique: false });
            }
        }
    });
};

const unique = (v, i, self) => { return self.indexOf(v) === i; };

const loggingServicePath = "/autorun/loggingService.js";
class LoggingSettings {
    gameHost;
    loggingHost;
    metricHost;
    constructor(gameHost, loggingHost, metricHost) {
        if (gameHost)
            this.gameHost = gameHost;
        if (loggingHost)
            this.loggingHost = loggingHost;
        if (metricHost)
            this.metricHost = metricHost;
    }
    static fromJSON(d) {
        return Object.assign(new LoggingSettings(), JSON.parse(d));
    }
}
let graphiteUrl;
let graphiteRequest;
const setupGraphite = function (settings) {
    graphiteUrl = `${settings.metricHost}/`;
    graphiteRequest = {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        }
    };
};
const sendTrace = async function (ns, settings, payloads) {
    if (payloads.length === 0) {
        return true;
    }
    if ("key" in payloads[0].payload) {
        // const tags = `;trace=${payload.trace};host=${payload.host};script=${payload.script}`
        for (const payload of payloads) {
            if ("key" in payload.payload) {
                const metricName = `bitburner.${settings.gameHost}.${payload.payload.key}`;
                const request = graphiteRequest;
                request.body = `${metricName} ${payload.payload.value} ${Math.floor(Date.now() / 1000)}\n`;
                const response = await fetch(graphiteUrl, request);
                if (!response.ok) {
                    ns.tprint(`ERROR: Failed to send metric to graphite. HTTP code: ${response.status}`);
                    return false;
                }
            }
        }
        return true;
    }
    return false;
};
const sendLog = async function (ns, settings, payload) {
    if (payload.length === 0) {
        return true;
    }
    if ("message" in payload[0].payload) {
        const values = payload.map(payload => [`${payload.timestamp}`, payload.payload.message]);
        const request = lokiRequest;
        const body = {
            "streams": [
                {
                    "stream": {
                        "trace": payload[0].trace,
                        "host": payload[0].host,
                        "script": payload[0].script,
                        "game": settings.gameHost,
                        "level": payload[0].payload.level
                    },
                    "values": values
                }
            ]
        };
        request.body = JSON.stringify(body);
        const response = await fetch(lokiUrl, request);
        if (!response.ok) {
            ns.tprint(`ERROR: Failed to send logging to loki. HTTP code: ${response.status}`);
        }
        return response.ok;
    }
    return false;
};
let lokiUrl;
let lokiRequest;
const setupLoki = function (settings) {
    lokiUrl = `${settings.loggingHost}/loki/api/v1/push`;
    lokiRequest = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
};
const loggingSettingsFile = "loggingSettings.txt";
const checkLoggingSettings = async function (ns) {
    const settings = LoggingSettings.fromJSON(ns.read(loggingSettingsFile));
    let saveSettings = false;
    if (!settings.gameHost) {
        saveSettings = true;
        const host = await ns.prompt("Enter Game Identifier", { type: "text" });
        if (typeof host === 'string')
            settings.gameHost = host;
    }
    if (!settings.loggingHost) {
        saveSettings = true;
        const host = await ns.prompt("Enter Logging server host address (http://loki.example.org:3100)", { type: "text" });
        if (typeof host === 'string')
            settings.loggingHost = host;
    }
    if (!settings.metricHost) {
        saveSettings = true;
        const host = await ns.prompt("Enter metric server host address (http://graphite.example.org:2003)", { type: "text" });
        if (typeof host === 'string')
            settings.metricHost = host;
    }
    if (saveSettings) {
        await ns.write(loggingSettingsFile, JSON.stringify(settings), "w");
    }
    return settings;
};
async function main(ns) {
    const loggingSettings = await checkLoggingSettings(ns);
    setupLoki(loggingSettings);
    setupGraphite(loggingSettings);
    await initLogging(ns);
    const loggingDB = getLoggingDB();
    while (true) {
        await sendLogs(loggingDB, ns, loggingSettings, LoggingTable, sendLog);
        await sendLogs(loggingDB, ns, loggingSettings, MetricTable, sendTrace);
        await ns.sleep(100);
    }
}
async function sendLogs(loggingDB, ns, loggingSettings, table, sender) {
    const logLinesGetAll = await loggingDB.transaction(table, 'readonly').store.getAll(null, 5000);
    const linesByTrace = new Map();
    logLinesGetAll.map(x => x.trace).filter(unique).forEach(trace => {
        const lines = logLinesGetAll.filter(v => { return v.trace === trace; });
        const keys = lines.map(line => line.timestamp);
        linesByTrace.set(trace, [lines, keys]);
    });
    const traceSuccessful = new Map();
    for (const trace of linesByTrace) {
        if (trace[1][0].length > 0) {
            traceSuccessful.set(trace[0], await sender(ns, loggingSettings, trace[1][0]));
        }
    }
    const toDelete = [];
    for (const trace of linesByTrace) {
        if (traceSuccessful.get(trace[0]) && trace[1][1].length > 0) {
            for (const index of trace[1][1]) {
                const cursor = await loggingDB.transaction(table, 'readonly').store.index("timestamp").openCursor(index);
                if (cursor) {
                    toDelete.push(cursor.primaryKey);
                }
            }
        }
    }
    const deletes = [];
    const tx = loggingDB.transaction(table, 'readwrite');
    toDelete.forEach(primaryKey => {
        deletes.push(tx.store.delete(primaryKey));
    });
    deletes.push(tx.done);
    await Promise.all(deletes)
        .catch(x => console.log(`failed to delete: ${x}`));
}

export { loggingServicePath, main };
