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

const open = async function (dbName, dbVersion, createDB) {
    return new Promise((resolve, reject) => {
        const eval2 = eval;
        const win = eval2('window');
        const loggingDBRequest = win.indexedDB.open(dbName, dbVersion);
        loggingDBRequest.onsuccess = event => {
            const target = event.target;
            resolve(wrap(target.result));
        };
        loggingDBRequest.onerror = event => {
            const target = event.target;
            reject(`Unable to open loggingdb: ${target.error}`);
        };
        loggingDBRequest.onupgradeneeded = event => {
            createDB(event);
        };
    });
};
const DB = {
    open: open
};

var Level;
(function (Level) {
    Level[Level["Error"] = 0] = "Error";
    Level[Level["Warning"] = 1] = "Warning";
    Level[Level["Info"] = 2] = "Info";
    Level[Level["success"] = 3] = "success";
})(Level || (Level = {}));
class LoggingPayload {
    host;
    script;
    trace;
    timestamp;
    payload;
    constructor(host, script, trace, payload) {
        if (host)
            this.host = host;
        if (script)
            this.script = script;
        if (trace)
            this.trace = trace;
        if (payload)
            this.payload = payload;
        this.timestamp = Date.now() * 1000000;
    }
    static fromJSON(d) {
        return Object.assign(new LoggingPayload(), JSON.parse(d));
    }
}
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
const createDB = function (event) {
    const target = event.target;
    const db = target.result;
    const prevVersion = event.oldVersion;
    if (prevVersion < 1) {
        const loggingStore = db.createObjectStore(LoggingTable, { autoIncrement: true });
        loggingStore.createIndex("timestamp", "timestamp", { unique: false });
        const metricStore = db.createObjectStore(MetricTable, { autoIncrement: true });
        metricStore.createIndex("timestamp", "timestamp", { unique: false });
    }
};
const getLoggingDB = function () {
    return loggingDB;
};
const initLogging = async function (ns) {
    loggingDB = await DB.open("BBLogging", DBVERSION, createDB);
};

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
const sendTrace = async function (ns, settings, payload) {
    if ("key" in payload.payload) {
        // const tags = `;trace=${payload.trace};host=${payload.host};script=${payload.script}`
        const metricName = `bitburner.${settings.gameHost}.${payload.payload.key}`;
        const request = graphiteRequest;
        request.body = `${metricName} ${payload.payload.value} ${Math.floor(Date.now() / 1000)}\n`;
        const response = await fetch(graphiteUrl, request);
        if (!response.ok) {
            ns.tprint(`ERROR: Failed to send metric to graphite. HTTP code: ${response.status}`);
        }
    }
};
const sendLog = async function (ns, settings, payload) {
    if ("message" in payload.payload) {
        const request = lokiRequest;
        const body = {
            "streams": [
                {
                    "stream": {
                        "trace": payload.trace,
                        "host": payload.host,
                        "script": payload.script,
                        "game": settings.gameHost,
                        "level": payload.payload.level
                    },
                    "values": [
                        [payload.timestamp, payload.payload.message]
                    ]
                }
            ]
        };
        request.body = JSON.stringify(body);
        const response = await fetch(lokiUrl, request);
        if (!response.ok) {
            ns.tprint(`ERROR: Failed to send logging to loki. HTTP code: ${response.status}`);
        }
    }
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
        const logLines = new Map();
        let logLineCursor = await loggingDB.transaction(LoggingTable, 'readonly').store.openCursor();
        while (logLineCursor != null && logLines.size < 5000) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion 
            logLines.set(logLineCursor.primaryKey, logLineCursor.value);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            logLineCursor = await logLineCursor.continue();
        }
        for (const logline of logLines) {
            const payload = LoggingPayload.fromJSON(JSON.stringify(logline[1]));
            if ("message" in payload.payload) {
                await sendLog(ns, loggingSettings, payload);
            }
            const tx = loggingDB.transaction(LoggingTable, 'readwrite');
            await tx.store.delete(logline[0]);
            tx.commit();
            if (logline[0] % 10 === 0) {
                ns.print(`sent log ${logline[0]}`);
            }
        }
        const metrics = new Map();
        let metricCursor = await loggingDB.transaction(MetricTable, 'readonly').store.openCursor();
        while (metricCursor != null && metrics.size < 5000) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            metrics.set(metricCursor.primaryKey, metricCursor.value);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            metricCursor = await metricCursor.continue();
        }
        for (const metric of metrics) {
            const payload = LoggingPayload.fromJSON(JSON.stringify(metric[1]));
            if ("key" in payload.payload) {
                await sendTrace(ns, loggingSettings, payload);
            }
            const tx = loggingDB.transaction(MetricTable, 'readwrite');
            await tx.store.delete(metric[0]);
            tx.commit();
            if (metric[0] % 10 === 0) {
                ns.print(`sent metric ${metric[0]}`);
            }
        }
        await ns.sleep(1);
    }
}

export { loggingServicePath, main };
