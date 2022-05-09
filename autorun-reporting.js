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
    ns.disableLog('ALL');
    ns.clearLog();
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
    if (n) {
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
    }
    else {
        throw new Error("Logging not initalised");
    }
};
const sendMetric = function (key, value) {
    const logPayload = new LoggingPayload(n.getHostname(), n.getScriptName(), loggingTrace, {
        key: key,
        value: value,
    });
    const tx = loggingDB.transaction(MetricTable, 'readwrite');
    void tx.store.add(logPayload);
};

function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}

const reportingPath = "/autorun/reporting.js";
const getBitnode = function (ns) {
    const player = ns.getPlayer();
    const bitnode = ns.getOwnedSourceFiles().filter(src => { return src.n === player.bitNodeN; })[0];
    return `${bitnode.n}.${bitnode.lvl}`;
};
async function main(ns) {
    await initLogging(ns);
    const constPlayer = ns.getPlayer();
    // if(constPlayer.bitNodeN !=5 || ns.getOwnedSourceFiles()[5].>){
    //     const bitnodeMultiplier = ns.getBitNodeMultipliers()
    // }
    sendMetric("player.multiplier.hacking.chance", constPlayer.hacking_chance_mult);
    sendMetric("player.multiplier.hacking.speed", constPlayer.hacking_speed_mult);
    sendMetric("player.multiplier.hacking.money", constPlayer.hacking_money_mult);
    sendMetric("player.multiplier.hacking.growth", constPlayer.hacking_grow_mult);
    sendMetric("player.multiplier.stat.hacking.level", constPlayer.hacking_mult);
    sendMetric("player.multiplier.stat.hacking.exp", constPlayer.hacking_exp_mult);
    sendMetric("player.multiplier.stat.strength.level", constPlayer.strength_mult);
    sendMetric("player.multiplier.stat.strength.exp", constPlayer.strength_exp_mult);
    sendMetric("player.multiplier.stat.defense.level", constPlayer.defense_mult);
    sendMetric("player.multiplier.stat.defense.exp", constPlayer.defense_exp_mult);
    sendMetric("player.multiplier.stat.dexterity.level", constPlayer.dexterity_mult);
    sendMetric("player.multiplier.stat.dexterity.exp", constPlayer.dexterity_exp_mult);
    sendMetric("player.multiplier.stat.agility.level", constPlayer.agility_mult);
    sendMetric("player.multiplier.stat.agility.exp", constPlayer.agility_exp_mult);
    sendMetric("player.multiplier.stat.charisma.level", constPlayer.charisma_mult);
    sendMetric("player.multiplier.stat.charisma.exp", constPlayer.charisma_exp_mult);
    sendMetric("player.multiplier.hacknet.node.production", constPlayer.hacknet_node_money_mult);
    sendMetric("player.multiplier.hacknet.node.purchase_cost", constPlayer.hacknet_node_purchase_cost_mult);
    sendMetric("player.multiplier.hacknet.node.ram_upgrade_cost", constPlayer.hacknet_node_ram_cost_mult);
    sendMetric("player.multiplier.hacknet.node.core_upgrade_cost", constPlayer.hacknet_node_core_cost_mult);
    sendMetric("player.multiplier.hacknet.node.level_upgrade_cost", constPlayer.hacknet_node_level_cost_mult);
    sendMetric("player.multiplier.reputation.faction_gain", constPlayer.faction_rep_mult);
    sendMetric("player.multiplier.reputation.company_gain", constPlayer.company_rep_mult);
    sendMetric("player.multiplier.reputation.salary", constPlayer.work_money_mult);
    sendMetric("player.multiplier.hacknet.node.level_upgrade_cost", constPlayer.hacknet_node_level_cost_mult);
    sendMetric("player.multiplier.crime.success", constPlayer.crime_success_mult);
    sendMetric("player.multiplier.crime.money", constPlayer.crime_money_mult);
    while (true) {
        const player = ns.getPlayer();
        sendMetric("player.money", player.money);
        sendMetric("player.stats.level.hack", player.hacking);
        sendMetric("player.stats.level.strength", player.strength);
        sendMetric("player.stats.level.defense", player.defense);
        sendMetric("player.stats.level.dexterity", player.dexterity);
        sendMetric("player.stats.level.agility", player.agility);
        sendMetric("player.stats.level.charisma", player.charisma);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore property is intentionally undocumented.
        sendMetric("player.stats.level.karma", ns.heart.break());
        sendMetric("player.bitnode", getBitnode(ns));
        getAllServers(ns).concat('home').filter(server => {
            const serverInfo = ns.getServer(server);
            return serverInfo.backdoorInstalled || serverInfo.purchasedByPlayer;
        })
            .forEach(server => {
            log(Level.Info, `server:${server} ramused:${ns.getServerUsedRam(server)} rammax:${ns.getServerMaxRam(server)}`);
        });
        getAllServers(ns).concat('home')
            .forEach(server => {
            const ServerInfo = ns.getServer(server);
            sendMetric(`server.${server.replaceAll(".", "-")}.backdoorInstalled`, ServerInfo.backdoorInstalled ? 1 : 0);
            sendMetric(`server.${server.replaceAll(".", "-")}.playerOwned`, ServerInfo.purchasedByPlayer ? 1 : 0);
            sendMetric(`server.${server.replaceAll(".", "-")}.requiredHacking`, ServerInfo.requiredHackingSkill ? 1 : 0);
            sendMetric(`server.${server.replaceAll(".", "-")}.backdoorable`, ServerInfo.openPortCount >= ServerInfo.numOpenPortsRequired ? 1 : 0);
            sendMetric(`server.${server.replaceAll(".", "-")}.maxRam`, ns.getServerMaxRam(server));
            sendMetric(`server.${server.replaceAll(".", "-")}.usedRam`, ns.getServerUsedRam(server));
            sendMetric(`server.${server.replaceAll(".", "-")}.securitylevel`, ns.getServerSecurityLevel(server));
            sendMetric(`server.${server.replaceAll(".", "-")}.minsecuritylevel`, ns.getServerMinSecurityLevel(server));
            sendMetric(`server.${server.replaceAll(".", "-")}.money`, ns.getServerMoneyAvailable(server));
            sendMetric(`server.${server.replaceAll(".", "-")}.maxmoney`, ns.getServerMaxMoney(server));
        });
        await ns.sleep(90000);
    }
}

export { main, reportingPath };
