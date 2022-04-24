const unique = (v, i, self) => { return self.indexOf(v) === i; };

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
const initLogging = async function (ns) {
    // loggingDB = await DB.open("BBLogging",DBVERSION,createDB)
    await openDB("BBLogging", DBVERSION, {
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

const factions = [
    "CyberSec",
    "Tian Di Hui",
    "Netburners",
    "Sector-12",
    "Chongqing",
    "New Tokyo",
    "Ishima",
    "Aevum",
    "Volhaven",
    "NiteSec",
    "The Black Hand",
    "BitRunners",
    "ECorp",
    "MegaCorp",
    "KuaiGong International",
    "Four Sigma",
    "NWO",
    "Blade Industries",
    "OmniTek Incorporated",
    "Bachman & Associates",
    "Clarke Incorporated",
    "Fulcrum Secret Technologies",
    "Slum Snakes",
    "Tetrads",
    "Silhouette",
    "Speakers for the Dead",
    "The Dark Army",
    "The Syndicate",
    "The Covenant",
    "Daedalus",
    "Illuminati",
    // "Bladeburners",              //not sure who these are yet.
    // "Church of the Machine God", //not sure who these are yet.
];
const getAllAugmentsFromFaction = function (ns, faction) {
    return ns.singularity.getAugmentationsFromFaction(faction);
};

const makeTable = function (ns, headers, data, padding = 1) {
    const getLineLength = function (minColWidths, padding) {
        //text length + padding each side of text + len(entries)+ seperators
        return minColWidths.reduce((p, n) => { return p + n + 2 * padding; }) + minColWidths.length + 3;
    };
    const getMinColWidth = function (rows, padding) {
        return rows.map(row => { return row.length; }).reduce((p, n) => {
            return Math.max(p, n + (padding * 2));
        });
    };
    const makeRowSplit = function (length) {
        return '-'.repeat(length) + '\n';
    };
    const padCell = function (content, width) {
        const paddingCells = width - content.length;
        return `${' '.repeat(Math.floor(paddingCells / 2))}${content}${' '.repeat(Math.ceil(paddingCells / 2))}`;
    };
    const makeRow = function (values, widths, padding) {
        const paddedCells = values.map((v, i) => { return `${' '.repeat(padding)}${padCell(v, widths[i])}${' '.repeat(padding)}`; });
        return `|${paddedCells.join('|')}|\n`;
    };
    const extractColumnValues = function (data, column) {
        return data.map(r => { return r[column]; });
    };
    const widths = headers.map((v, i) => { return getMinColWidth([v, ...extractColumnValues(data, i)], padding); });
    const lineLength = getLineLength(widths, padding);
    const headerRow = makeRow(headers, widths, padding);
    const seperator = makeRowSplit(lineLength);
    const dataRows = data.map(d => { return makeRow(d, widths, padding); });
    const joinedRows = dataRows.join(`${seperator}`);
    ns.printf(`${seperator}${headerRow}${seperator}${joinedRows}${seperator}`);
};

const dumpAllAugmentsPath = "/augments/dumpAllAugments.js";
async function main(ns) {
    await initLogging(ns);
    ns.clearLog();
    ns.tail();
    const augments = ns.singularity.getOwnedAugmentations(true);
    factions.forEach(faction => {
        augments.push(...getAllAugmentsFromFaction(ns, faction));
    });
    const flags = ns.flags([['player', false], ['hacking', false], ['faction', false], ['hacknet', false], ['bladeburner', false], ['all', false]]);
    const NToS = function (val) {
        if (val === undefined)
            return '-';
        return ns.nFormat(val, '0,0.000');
    };
    const augmentData = augments.filter(unique).sort().map(augment => {
        const augmentInfo = ns.singularity.getAugmentationStats(augment);
        const player = [NToS(augmentInfo.hacking_mult), NToS(augmentInfo.strength_mult), NToS(augmentInfo.defense_mult), NToS(augmentInfo.dexterity_mult), NToS(augmentInfo.agility_mult), NToS(augmentInfo.charisma_mult),
            NToS(augmentInfo.hacking_exp_mult), NToS(augmentInfo.strength_exp_mult), NToS(augmentInfo.defense_exp_mult), NToS(augmentInfo.dexterity_exp_mult), NToS(augmentInfo.agility_exp_mult), NToS(augmentInfo.charisma_exp_mult)];
        const hacking = [NToS(augmentInfo.hacking_chance_mult), NToS(augmentInfo.hacking_speed_mult), NToS(augmentInfo.hacking_money_mult), NToS(augmentInfo.hacking_grow_mult)];
        const faction = [NToS(augmentInfo.company_rep_mult), NToS(augmentInfo.faction_rep_mult), NToS(augmentInfo.crime_money_mult), NToS(augmentInfo.crime_success_mult), NToS(augmentInfo.work_money_mult)];
        const hacknet = [NToS(augmentInfo.hacknet_node_money_mult), NToS(augmentInfo.hacknet_node_purchase_cost_mult), NToS(augmentInfo.hacknet_node_ram_cost_mult), NToS(augmentInfo.hacknet_node_core_cost_mult), NToS(augmentInfo.hacknet_node_level_cost_mult)];
        const bladeburner = [NToS(augmentInfo.bladeburner_max_stamina_mult), NToS(augmentInfo.bladeburner_stamina_gain_mult), NToS(augmentInfo.bladeburner_analysis_mult), NToS(augmentInfo.bladeburner_success_chance_mult)];
        return [player, hacking, faction, hacknet, bladeburner];
    });
    const defaultData = augments.filter(unique).sort().map(augment => { return [augment, ns.nFormat(ns.singularity.getAugmentationPrice(augment), '($ 0.00a)')]; });
    const defaultHeaders = ['augment', 'price'];
    const playerHeaders = ['hack', 'str', 'def', 'dex', 'agi', 'cha', 'hack xp', 'str xp', 'def xp', 'dex xp', 'agi xp', 'cha xp'];
    const hackingHeaders = ['hack chance', 'hack speed', 'hack money', 'hack growth'];
    const factionHeaders = ['comp rep', 'fact rep', 'crime mon', 'crime success', 'work mon'];
    const hacknetHeaders = ['hacknet node mon', 'hacknet node cost', 'hacknet ram cost', 'hacknet core cost', 'hacknet level cost'];
    const bladeburnerHeaders = ['bladeburner stamina', 'bladeburner stamina gain', 'bladeburner analysis', 'bladeburner success'];
    const playerInfo = augmentData.map(ad => { return ad[0]; });
    const hackingInfo = augmentData.map(ad => { return ad[1]; });
    const factionInfo = augmentData.map(ad => { return ad[2]; });
    const hacknetInfo = augmentData.map(ad => { return ad[3]; });
    const bladeburnerInfo = augmentData.map(ad => { return ad[4]; });
    const tableHeaders = defaultHeaders;
    const tableData = defaultData;
    if (flags.player || flags.all) {
        tableHeaders.push(...playerHeaders);
        tableData.forEach((v, i) => { v.push(...playerInfo[i]); });
    }
    if (flags.hacking || flags.all) {
        tableHeaders.push(...hackingHeaders);
        tableData.forEach((v, i) => { v.push(...hackingInfo[i]); });
    }
    if (flags.faction || flags.all) {
        tableHeaders.push(...factionHeaders);
        tableData.forEach((v, i) => { v.push(...factionInfo[i]); });
    }
    if (flags.hacknet || flags.all) {
        tableHeaders.push(...hacknetHeaders);
        tableData.forEach((v, i) => { v.push(...hacknetInfo[i]); });
    }
    if (flags.bladeburner || flags.all) {
        tableHeaders.push(...bladeburnerHeaders);
        tableData.forEach((v, i) => { v.push(...bladeburnerInfo[i]); });
    }
    const filteredData = (flags.all || flags.player || flags.hacking || flags.faction || flags.hacknet || flags.bladeburner) ? tableData.filter(val => {
        return !val.every((v, i) => { return i === 0 || i === 1 || v === '-'; });
    }) : tableData;
    makeTable(ns, tableHeaders, filteredData, 1);
}

export { dumpAllAugmentsPath, main };
