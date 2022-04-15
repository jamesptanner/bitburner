const prepareHostPath = "/batching/prepareHost.js";

function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}
const findBestTarget = function (ns) {
    let maxFunds = 0;
    let bestServer = "";
    getAllServers(ns).forEach(server => {
        const serverDetails = ns.getServer(server);
        if (serverDetails.backdoorInstalled && serverDetails.moneyMax > maxFunds) {
            bestServer = server;
            maxFunds = serverDetails.moneyMax;
        }
    });
    return bestServer;
};

const weakenPath = "/batching/weaken.js";

const hackPath = "/batching/hack.js";

const growPath = "/batching/grow.js";

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
        this.timestamp = (performance.now() + performance.timeOrigin) * 1000000;
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
const loggingTrace = generateUUID();
let n;
const DBVERSION = 1;
const LoggingTable = "logging";
const MetricTable = "metrics";
let loggingDB;
const initLogging = async function (ns) {
    n = ns;
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
const levelToString = function (level) {
    switch (level) {
        case Level.Error:
            return "ERROR";
        case Level.Info:
            return "INFO";
        case Level.Warning:
            return "WARNING";
        case Level.success:
            return "SUCCESS";
    }
    return "";
};
const levelToToast = function (level) {
    switch (level) {
        case Level.Error:
            return "error";
        case Level.Info:
            return "info";
        case Level.Warning:
            return "warning";
        case Level.success:
            return "success";
    }
    return undefined;
};
const log = function (level, msg, toast) {
    if (toast) {
        n.toast(`${levelToString(level)}: ${msg}`, levelToToast(level));
    }
    n.print(`${levelToString(level)}: ${msg}`);
    const logPayload = new LoggingPayload(n.getHostname(), n.getScriptName(), loggingTrace, {
        level: level,
        message: msg,
    });
    const tx = loggingDB.transaction(LoggingTable, 'readwrite');
    void tx.store.add(logPayload);
};

const hackingDaemonPath = "/batching/hackingDaemon.js";
async function main(ns) {
    ns.disableLog('ALL');
    await initLogging(ns);
    const target = findBestTarget(ns);
    const servers = getAllServers(ns);
    await waitForBatchedHackToFinish(ns);
    // prepare the server for attack. max mon, min sec.
    for (const server of servers) {
        await ns.scp([prepareHostPath, weakenPath, growPath, hackPath], server);
    }
    //throw everything we have at it and wait for the threads to finish.
    const prepPid = servers.map(server => {
        const ramAvalible = ns.getServer(server).maxRam - ns.getServer(server).ramUsed;
        if (ramAvalible / ns.getScriptRam(prepareHostPath) > 1)
            return ns.exec(prepareHostPath, server, Math.floor(ramAvalible / ns.getScriptRam(prepareHostPath)), target);
        return 0;
    });
    await waitForPids(prepPid, ns);
    const hack_time = ns.getHackTime(target);
    const weak_time = ns.getWeakenTime(target);
    const grow_time = ns.getGrowTime(target);
    const t0 = 1000;
    let period = 0;
    let depth = 0;
    const kW_max = Math.floor(1 + (weak_time - 4 * t0) / (8 * t0));
    schedule: for (let kW = kW_max; kW >= 1; --kW) {
        const t_min_W = (weak_time + 4 * t0) / kW;
        const t_max_W = (weak_time - 4 * t0) / (kW - 1);
        const kG_min = Math.ceil(Math.max((kW - 1) * 0.8, 1));
        const kG_max = Math.floor(1 + kW * 0.8);
        for (let kG = kG_max; kG >= kG_min; --kG) {
            const t_min_G = (grow_time + 3 * t0) / kG;
            const t_max_G = (grow_time - 3 * t0) / (kG - 1);
            const kH_min = Math.ceil(Math.max((kW - 1) * 0.25, (kG - 1) * 0.3125, 1));
            const kH_max = Math.floor(Math.min(1 + kW * 0.25, 1 + kG * 0.3125));
            for (let kH = kH_max; kH >= kH_min; --kH) {
                const t_min_H = (hack_time + 5 * t0) / kH;
                const t_max_H = (hack_time - 1 * t0) / (kH - 1);
                const t_min = Math.max(t_min_H, t_min_G, t_min_W);
                const t_max = Math.min(t_max_H, t_max_G, t_max_W);
                if (t_min <= t_max) {
                    period = t_min;
                    depth = kW;
                    break schedule;
                }
            }
        }
    }
    //depth - number of batches
    //period - one full cycle
    const startTime = Date.now();
    let event = 1;
    while (true) {
        if (event % 120 == 0) {
            await ns.sleep(60 * 1000);
            // //check we are hacking the right target 
            const newTarget = findBestTarget(ns);
            if (newTarget !== target) {
                await waitForBatchedHackToFinish(ns);
                //restart
                ns.spawn(hackingDaemonPath);
            }
        }
        const scheduleWorked = await ScheduleHackEvent(event, weak_time, hack_time, grow_time, startTime, depth, period, t0, ns, target);
        if (!scheduleWorked) {
            ns.toast(`Unable to schedule batch task`, "error", 10000);
            await ns.sleep((event % 120) * 1000);
        }
        else {
            event++;
        }
    }
    ns.printf(`length of cycle: ${period}`);
    ns.printf(`Number of cycles needed: ${depth}`);
}
async function waitForBatchedHackToFinish(ns) {
    ns.printf(`waiting for current hacking threads to finish.`);
    const pids = getAllServers(ns).map(server => {
        return ns.ps(server);
    })
        .reduce((prev, curr) => {
        return prev.concat(...curr);
    }, [])
        .filter(proc => {
        return proc.filename == weakenPath || proc.filename == growPath || proc.filename === hackPath;
    })
        .map(procInfo => procInfo.pid);
    await waitForPids(pids, ns);
}
async function waitForPids(pids, ns) {
    do {
        const finished = pids.filter(pid => pid === 0 || !ns.isRunning(pid, ""));
        finished.forEach(pid => pids.splice(pids.indexOf(pid), 1));
        ns.printf(`${pids.length} processes left`);
        if (pids.length > 0)
            await ns.sleep(30 * 1000);
    } while (pids.length > 0);
}
async function ScheduleHackEvent(event, weak_time, hack_time, grow_time, startTime, depth, period, t0, ns, target) {
    let event_time = 0;
    let event_script = "";
    switch (event % 4) {
        case 1:
        case 3:
            event_time = weak_time;
            event_script = weakenPath;
            break;
        case 0:
            event_time = hack_time;
            event_script = hackPath;
            break;
        case 2:
            event_time = grow_time;
            event_script = growPath;
            break;
    }
    const script_start = startTime + (depth * period) - (event * t0 * -1) - event_time;
    if (script_start < 0) {
        ns.toast(`Wait time negative. restarting script.`, "error", 10000);
        await ns.sleep(weak_time);
        ns.spawn(hackingDaemonPath, 1);
    }
    log(Level.Info, `{"name":"${event_script}-${event}", "startTime":"${new Date(script_start).toISOString()}", "duration":${Math.floor(event_time / 1000)}}`);
    ns.printf(`${event_script}: To Complete ${new Date(script_start + event_time).toISOString()}`);
    return runTask(ns, event_script, target, script_start);
}
async function runTask(ns, script, ...args) {
    const servers = getAllServers(ns);
    //find a server with enough free memory to run the script.
    const scriptMem = ns.getScriptRam(script);
    const candidateServers = servers.filter(server => {
        const serverInfo = ns.getServer(server);
        const memFree = serverInfo.maxRam - serverInfo.ramUsed;
        return (serverInfo.backdoorInstalled || serverInfo.purchasedByPlayer) && memFree > scriptMem;
    });
    if (candidateServers.length == 0)
        return false;
    await ns.scp(script, candidateServers[0]);
    const pid = ns.exec(script, candidateServers[0], 1, ...args);
    if (pid === 0) {
        ns.printf(`Failed to run ${script} on ${candidateServers[0]}`);
        return false;
    }
    ns.printf(`Scheduled ${script} to run on ${candidateServers[0]}`);
    return true;
}

export { hackingDaemonPath, main };
