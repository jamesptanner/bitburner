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
        this.timestamp = (Date.now()) * 1000000;
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
const success = function (msg, toast) {
    log(Level.success, msg, toast);
};
const info = function (msg, toast) {
    log(Level.Info, msg, toast);
};
const warning = function (msg, toast) {
    log(Level.Warning, msg, toast);
};
const error = function (msg, toast) {
    log(Level.Error, msg, toast);
};
const logging = {
    log: log,
    error: error,
    warning: warning,
    success: success,
    info: info
};

const unsolveableContractPath = "/contracts/unsolveableContract.js";

function asString(val) {
    if (typeof val === "string")
        return val;
    return String(val);
}
function asNumber(val) {
    if (typeof val === "number")
        return val;
    return NaN;
}
function is2DArray(val, elementGuard) {
    return Array.isArray(val) && val.every((va) => Array.isArray(va) && va.every(elementGuard));
}

// "Spiralize Matrix"
// Given an array of array of numbers representing a 2D matrix, return the
// elements of that matrix in clockwise spiral order.
// Example: The spiral order of
// [1, 2, 3, 4]
// [5, 6, 7, 8]
// [9, 10, 11, 12]
// is [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]
function SpiralMatrix(ns, data) {
    if (is2DArray(data, (val) => { return typeof val === 'number'; })) {
        logging.info(`${JSON.stringify(data)} type:${typeof data}`);
        const numberArray = data;
        const output = [];
        let state = 0;
        while (numberArray.length > 0) {
            switch (state % 4) {
                case 0: //top
                    {
                        const row = numberArray.shift();
                        if (row) {
                            output.push(...row);
                        }
                        break;
                    }
                case 1: //right
                    {
                        for (let row = 0; row < numberArray.length; row++) {
                            const val = numberArray[row].pop();
                            if (val) {
                                output.push(val);
                            }
                        }
                        break;
                    }
                case 2: //bottom
                    {
                        const row = numberArray.pop();
                        if (row) {
                            output.push(...(row.reverse()));
                        }
                        break;
                    }
                case 3: //left
                    {
                        for (let row = numberArray.length - 1; row >= 0; row--) {
                            const val = numberArray[row].shift();
                            if (val) {
                                output.push(val);
                            }
                        }
                        break;
                    }
            }
            state++;
        }
        //may have undefined entries which we can remove.
        logging.success(`SpiralMatrix Result: ${JSON.stringify(output.filter(x => x))}`);
        return output.filter(x => x).map(x => x.toString());
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Array Jumping Game"
// You are given an array of integers where each element represents the
// maximum possible jump distance from that position. For example, if you
// are at position i and your maximum jump length is n, then you can jump
// to any position from i to i+n.
// Assuming you are initially positioned at the start of the array, determine
// whether you are able to reach the last index of the array.
function ArrayJump(ns, data) {
    if (Array.isArray(data) && data.every(val => typeof val === 'number')) {
        logging.info(`${JSON.stringify(data)} type:${typeof data}`);
        const numberArray = data;
        const result = checkPosition(ns, numberArray, 0, 0);
        logging.success(`${result}`);
        if (result) {
            return 1;
        }
        return 0;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Array Jumping Game II"
// You are given the following array of integers:
// 4,3,7,5
// Each element in the array represents your MAXIMUM jump length at that position. 
// This means that if you are at position i and your maximum jump length is n, you 
// can jump to any position from i to i+n.
// Assuming you are initially positioned at the start of the array, determine the 
// minimum number of jumps to reach the end of the array.
// If it's impossible to reach the end, then the answer should be 0.
function ArrayJump2(ns, data) {
    if (Array.isArray(data) && data.every(val => typeof val === 'number')) {
        logging.info(`${JSON.stringify(data)} type:${typeof data}`);
        const numberArray = data;
        const [result, minHops] = checkPosition(ns, numberArray, 0, 0);
        logging.success(`${result}`);
        if (result) {
            return minHops;
        }
        return 0;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
function checkPosition(ns, array, pos, depth) {
    logging.info(`${array}: checking position ${pos}`);
    if (pos == array.length - 1)
        return [true, depth];
    let minHops = array.length;
    let ret = false;
    for (let jumpDist = 1; jumpDist <= array[pos]; jumpDist++) {
        logging.info(`Jumping ${jumpDist}`);
        const [reachedEnd, hops] = checkPosition(ns, array, pos + jumpDist, depth + 1);
        if (reachedEnd) {
            minHops = Math.min(minHops, hops);
            ret = true;
        }
    }
    logging.success(`${[ret, minHops]}`);
    return [ret, minHops];
}
// "Merge Overlapping Intervals"
// Given an array of intervals, merge all overlapping intervals. An interval
// is an array with two numbers, where the first number is always less than
// the second (e.g. [1, 5]).
// The intervals must be returned in ASCENDING order.
// Example:
// [[1, 3], [8, 10], [2, 6], [10, 16]]
// merges into [[1, 6], [8, 16]]
function MergeOverlapping(ns, data) {
    if (is2DArray(data, (val) => { return typeof val === 'number'; })) {
        const numberArray = data;
        numberArray.sort((a, b) => a[0] - b[0]);
        logging.info(`${JSON.stringify(numberArray)}`);
        for (let i = 0; i < numberArray.length - 1; i++) {
            if (numberArray[i][1] >= numberArray[i + 1][0]) {
                const newElement = [numberArray[i][0], Math.max(numberArray[i + 1][1], numberArray[i][1])];
                numberArray.splice(i, 2, newElement);
                logging.info(`${JSON.stringify(numberArray)}`);
                i--;
            }
        }
        logging.success(`${JSON.stringify((numberArray.length != 1) ? numberArray : numberArray[0])}`);
        return [JSON.stringify((numberArray.length != 1) ? numberArray : numberArray[0])];
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

// "Find Largest Prime Factor"
// Given a number, find its largest prime factor. A prime factor
// is a factor that is a prime number.
function largestPrimeFactor(ns, data) {
    if (typeof data === 'number') {
        logging.info(`${JSON.stringify(data)} type:${typeof data}`);
        let num = data;
        let factor = 2;
        do {
            while (num % factor == 0) {
                num = num / factor;
            }
            factor++;
        } while (factor != num);
        logging.success(`largest factor = ${factor}`);
        return factor;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Subarray with Maximum Sum"
// Given an array of integers, find the contiguous subarray (containing
// at least one number) which has the largest sum and return that sum.
function MaxSubArray(ns, data) {
    if (Array.isArray(data) && data.every(val => { return typeof val === 'number'; })) {
        const numberArray = data;
        logging.info(`${numberArray}`);
        let subArray = [];
        let subArrayTotal = -Infinity;
        for (let start = 0; start < numberArray.length; start++) {
            for (let length = 1; length <= numberArray.length - start; length++) {
                const testSubArray = numberArray.slice(start, start + length);
                const testSubArrayTotal = testSubArray.reduce((prev, curr) => { return prev + curr; });
                logging.info(`${testSubArray}: ${testSubArrayTotal}`);
                if (testSubArrayTotal > subArrayTotal) {
                    subArray = testSubArray;
                    subArrayTotal = testSubArrayTotal;
                }
            }
        }
        logging.success(`Best: ${subArray}: ${subArrayTotal}`);
        return subArrayTotal;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Total Ways to Sum"
// Given a number, how many different ways can that number be written as
// a sum of at least two positive integers?
function TotalSums(ns, data) {
    if (typeof data === 'number') {
        const value = data;
        // An array to store a partition
        const sums = new Array(value + 1);
        sums[0] = 1;
        sums.fill(0, 1);
        for (let i = 1; i < value; ++i) {
            for (let j = i; j <= value; ++j) {
                sums[j] += sums[j - i];
            }
        }
        logging.success(`total Sums: ${sums[value]}`);
        return sums[value];
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Total Ways to Sum"
//How many different distinct ways can the number 31 be written as a sum of integers contained in the set:
// [2,3,4,5,6,8,9,10]?
// You may use each integer in the set zero or more times.
function TotalSums2(ns, data) {
    if (Array.isArray(data) &&
        typeof data[0] === 'number' &&
        Array.isArray(data[1]) &&
        data[1].every(val => { return typeof val === 'number'; })) {
        const set = data[1];
        const value = data[0];
        logging.info(`total Sums2: target ${value}, set:${set.join()}`);
        // An array to store a partition
        const sums = new Array(value + 1);
        sums.fill(0, 0);
        sums[0] = 1;
        for (let i = 0; i <= sums.length; ++i) {
            for (let j = set[i]; j <= value; j++) {
                sums[j] += sums[j - set[i]];
            }
        }
        logging.success(`total Sums: ${sums[value]}`);
        logging.success(`total Sums: ${sums}`);
        return sums[value];
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

// "Minimum Path Sum in a Triangle"
// You are given a 2D array of numbers (array of array of numbers) that represents a
// triangle (the first array has one element, and each array has one more element than
// the one before it, forming a triangle). Find the minimum path sum from the top to the
// bottom of the triangle. In each step of the path, you may only move to adjacent
// numbers in the row below.
function MinTrianglePath(ns, data) {
    if (is2DArray(data, (val) => { return typeof val === 'number'; })) {
        const numberArray = data;
        for (let row = 1; row < numberArray.length; row++) {
            for (let col = 0; col < numberArray[row].length; col++) {
                if (col === 0) {
                    numberArray[row][col] += numberArray[row - 1][col];
                }
                else if (col === numberArray[row].length - 1) {
                    numberArray[row][col] += numberArray[row - 1][col - 1];
                }
                else {
                    numberArray[row][col] += Math.min(numberArray[row - 1][col], numberArray[row - 1][col - 1]);
                }
            }
        }
        logging.info(`${JSON.stringify(numberArray)}`);
        logging.success(`MinPath: ${Math.min(...numberArray[numberArray.length - 1])}`);
        return Math.min(...numberArray[numberArray.length - 1]);
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Unique Paths in a Grid I"
// You are given an array with two numbers: [m, n]. These numbers represent a
// m x n grid. Assume you are initially positioned in the top-left corner of that
// grid and that you are trying to reach the bottom-right corner. On each step,
// you may only move down or to the right.
// Determine how many unique paths there are from start to finish.
function UniquePath1(ns, data) {
    if (Array.isArray(data) && data.every(v => typeof v === 'number')) {
        const maxX = data[0];
        const maxY = data[1];
        const map = [];
        for (let x = 0; x < maxX; x++) {
            map[x] = [];
            for (let y = 0; y < maxY; y++) {
                if (x == 0 || y == 0) {
                    map[x][y] = 1;
                }
                else {
                    map[x][y] = map[x - 1][y] + map[x][y - 1];
                }
            }
        }
        logging.success(`paths: ${map[maxX - 1][maxY - 1]}`);
        return map[maxX - 1][maxY - 1];
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Unique Paths in a Grid II"
// You are given a 2D array of numbers (array of array of numbers) representing
// a grid. The 2D array contains 1’s and 0’s, where 1 represents an obstacle and
// 0 represents a free space.
// Assume you are initially positioned in top-left corner of that grid and that you
// are trying to reach the bottom-right corner. In each step, you may only move down
// or to the right. Furthermore, you cannot move onto spaces which have obstacles.
// Determine how many unique paths there are from start to finish.
function UniquePath2(ns, data) {
    if (is2DArray(data, (val) => { return typeof val === 'number'; })) {
        const maxX = data.length;
        const maxY = data[0].length;
        const map = data;
        for (let x = 0; x < maxX; x++) {
            for (let y = 0; y < maxY; y++) {
                if (map[x][y] == 1) {
                    map[x][y] = 0;
                }
                else {
                    if (x == 0 && y == 0) {
                        map[x][y] = 1;
                    }
                    else if (x == 0 || y == 0) {
                        if (x > 0) {
                            map[x][y] = map[x - 1][y] == 0 ? 0 : 1;
                        }
                        else if (y > 0) {
                            map[x][y] = map[x][y - 1] == 0 ? 0 : 1;
                        }
                    }
                    else {
                        map[x][y] = map[x - 1][y] + map[x][y - 1];
                    }
                }
            }
        }
        logging.info(`${JSON.stringify(map)} type:${typeof data}`);
        logging.success(`paths with obstacles : ${map[maxX - 1][maxY - 1]}`);
        return map[maxX - 1][maxY - 1];
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
function colorGraph(ns, data) {
    if (Array.isArray(data) && typeof data[0] === 'number' && is2DArray(data[1], (val) => { return typeof val === 'number'; })) {
        const nodeCount = data[0];
        const edges = data[1].sort((a, b) => { return a[0] - b[0]; });
        const out = new Array(nodeCount);
        out.fill(-1, 0);
        //start with vertex 0 
        out[0] = 0;
        logging.info(`${edges}`);
        let count = 0;
        while (out.some(v => { return v === -1; }) && count < 10) {
            for (let index = 0; index < out.length; index++) {
                const matchingEdges = edges.filter(v => { return v[0] === index; });
                if (out[index] === -1) {
                    //do we have a value for any of the opposite?
                    const usableEdges = matchingEdges.filter(v => { return v[1] != -1; });
                    if (usableEdges.length >= 1) {
                        out[index] = out[usableEdges[0][1]] === 1 ? 0 : 1;
                    }
                    else {
                        continue;
                    }
                }
                if (matchingEdges.some(edge => { return out[index] === out[edge[1]]; })) {
                    return [];
                }
                matchingEdges.forEach(edge => { out[edge[1]] = (out[index] === 1) ? 0 : 1; });
                logging.info(`i:${index} out: ${out}`);
            }
            count++;
        }
        logging.success(`out: ${out}`);
        return out;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

// "Algorithmic Stock Trader I"
// Determine the maximum possible profit you can earn using at most one
// transaction (i.e. you can buy an sell the stock once). If no profit
// can be made, then the answer should be 0. Note that you must buy the stock
// before you can sell it.
const isNumberArray = function (val) {
    return (Array.isArray(val) &&
        val.every((v) => {
            return typeof v === "number";
        }));
};
function StockTrader1(ns, data) {
    if (isNumberArray(data)) {
        const stocks = data;
        let bestProfit = 0;
        let maxCur = 0;
        for (let i = 1; i < stocks.length; ++i) {
            maxCur = Math.max(0, (maxCur += stocks[i] - stocks[i - 1]));
            bestProfit = Math.max(bestProfit, maxCur);
        }
        logging.success(`Stock1 Best profit: ${bestProfit}`);
        return bestProfit > 0 ? bestProfit : 0;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Algorithmic Stock Trader II"
// You are given an array of numbers representing stock prices, where the
// i-th element represents the stock price on day i.
// Determine the maximum possible profit you can earn using as many transactions
// as you’d like. A transaction is defined as buying and then selling one
// share of the stock. Note that you cannot engage in multiple transactions at
// once. In other words, you must sell the stock before you buy it again. If no
// profit can be made, then the answer should be 0.
function StockTrader2(ns, data) {
    if (isNumberArray(data)) {
        const stocks = data;
        let profit = 0;
        for (let i = 1; i < stocks.length; ++i) {
            profit += Math.max(0, stocks[i] - stocks[i - 1]);
        }
        logging.success(`Stock2 Best profit: ${profit}`);
        return profit > 0 ? profit : 0;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Algorithmic Stock Trader III"
// You are given an array of numbers representing stock prices, where the
// i-th element represents the stock price on day i.
// Determine the maximum possible profit you can earn using at most two
// transactions. A transaction is defined as buying and then selling one share
// of the stock. Note that you cannot engage in multiple transactions at once.
// In other words, you must sell the stock before you buy it again. If no profit
// can be made, then the answer should be 0.
function StockTrader3(ns, data) {
    if (isNumberArray(data)) {
        let hold1 = Number.MIN_SAFE_INTEGER;
        let hold2 = Number.MIN_SAFE_INTEGER;
        let release1 = 0;
        let release2 = 0;
        for (let _i = 0, data_1 = data; _i < data_1.length; _i++) {
            const price = data_1[_i];
            release2 = Math.max(release2, hold2 + price);
            hold2 = Math.max(hold2, release1 - price);
            release1 = Math.max(release1, hold1 + price);
            hold1 = Math.max(hold1, price * -1);
        }
        return release2;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// "Algorithmic Stock Trader IV"
// You are given an array with two elements. The first element is an integer k.
// The second element is an array of numbers representing stock prices, where the
// i-th element represents the stock price on day i.
// Determine the maximum possible profit you can earn using at most k transactions.
// A transaction is defined as buying and then selling one share of the stock.
// Note that you cannot engage in multiple transactions at once. In other words,
// you must sell the stock before you can buy it. If no profit can be made, then
// the answer should be 0.
function StockTrader4(ns, data) {
    if (Array.isArray(data) && typeof data[0] === "number" && isNumberArray(data[1])) {
        const k = data[0];
        const prices = data[1];
        const len = prices.length;
        if (len < 2) {
            return 0;
        }
        if (k > len / 2) {
            let res = 0;
            for (let i = 1; i < len; ++i) {
                res += Math.max(prices[i] - prices[i - 1], 0);
            }
            return res;
        }
        const hold = [];
        const release = [];
        hold.length = k + 1;
        release.length = k + 1;
        for (let i = 0; i <= k; ++i) {
            hold[i] = Number.MIN_SAFE_INTEGER;
            release[i] = 0;
        }
        let cur;
        for (let i = 0; i < len; ++i) {
            cur = prices[i];
            for (let j = k; j > 0; --j) {
                release[j] = Math.max(release[j], hold[j] + cur);
                hold[j] = Math.max(hold[j], release[j - 1] - cur);
            }
        }
        return release[k];
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

// "Generate IP Addresses"
// Given a string containing only digits, return an array with all possible
// valid IP address combinations that can be created from the string.
// An octet in the IP address cannot begin with ‘0’ unless the number itself
// is actually 0. For example, “192.168.010.1” is NOT a valid IP.
// Examples:
// 25525511135 -> [255.255.11.135, 255.255.111.35]
// 1938718066 -> [193.87.180.66]
function GenerateIPAddresses(ns, data) {
    logging.info(`${JSON.stringify(data)} type:${typeof data}`);
    const baseAddress = asString(data);
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[1]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[1]?[0-9][0-9]?)$/;
    const validAddresses = [];
    const expectedLength = baseAddress.length + 3;
    for (let octalSize1 = 1; octalSize1 <= 3; octalSize1++) {
        for (let octalSize2 = 1; octalSize2 <= 3; octalSize2++) {
            for (let octalSize3 = 1; octalSize3 <= 3; octalSize3++) {
                for (let octalSize4 = 1; octalSize4 <= 3; octalSize4++) {
                    let addressCopy = baseAddress;
                    let addrString = "";
                    addrString = parseInt(addressCopy.substring(0, octalSize1)) + ".";
                    addressCopy = addressCopy.slice(octalSize1);
                    addrString = addrString + parseInt(addressCopy.substring(0, octalSize2)) + ".";
                    addressCopy = addressCopy.slice(octalSize2);
                    addrString = addrString + parseInt(addressCopy.substring(0, octalSize3)) + ".";
                    addressCopy = addressCopy.slice(octalSize3);
                    addrString = addrString + parseInt(addressCopy.substring(0, octalSize4));
                    addressCopy = addressCopy.slice(octalSize4);
                    if (addressCopy.length > 0) {
                        logging.error("invalid addr, leftover numbers");
                        continue;
                    }
                    logging.info(`addr: ${addrString}, leftover string: ${addressCopy}`);
                    if (addrString.length != expectedLength) {
                        logging.error("invalid addr, probably leading zeros.");
                        continue;
                    }
                    if (ipv4Regex.test(addrString)) {
                        logging.info(`valid address ${addrString}`);
                        validAddresses.push(addrString);
                    }
                    else {
                        logging.error(`invalid address ${addrString}`);
                    }
                }
            }
        }
    }
    logging.success(`Valid Addresses ${validAddresses.filter((v, i, self) => {
        return self.indexOf(v) === i;
    })}`);
    return validAddresses.filter((v, i, self) => {
        return self.indexOf(v) === i;
    });
}
// "Sanitize Parentheses in Expression"
// Given a string with parentheses and letters, remove the minimum number of invalid
// parentheses in order to validate the string. If there are multiple minimal ways
// to validate the string, provide all of the possible results.
// The answer should be provided as an array of strings. If it is impossible to validate
// the string, the result should be an array with only an empty string.
// Examples:
// ()())() -> [()()(), (())()]
// (a)())() -> [(a)()(), (a())()]
// )( -> [“”]
function SanitizeParentheses(ns, data) {
    logging.info(`${JSON.stringify(data)} type:${typeof data}`);
    const parentheses = asString(data);
    function isValid(parens) {
        logging.info(`Testing ${parens}`);
        let opens = 0;
        for (let index = 0; index < parens.length; index++) {
            if (parens.charAt(index) === "(") {
                opens++;
            }
            else if (parens.charAt(index) === ")") {
                opens--;
            }
            if (opens < 0) {
                return false;
            }
        }
        if (opens === 0) {
            logging.info("👍");
        }
        return opens === 0;
    }
    function removeChar(str, depth, ans) {
        for (let index = 0, strcpy = str; index < str.length; index++, strcpy = str) {
            strcpy = strcpy.substring(0, index) + strcpy.substring(index + 1);
            if (depth === 0) {
                if (isValid(strcpy)) {
                    ans.push(strcpy);
                }
            }
            else {
                removeChar(strcpy, depth - 1, ans);
            }
        }
    }
    const answers = [];
    if (isValid(parentheses)) {
        answers.push(parentheses);
    }
    let n = 0;
    while (answers.length == 0) {
        logging.info(`at depth ${n}`);
        if (n === parentheses.length) {
            answers.push("");
        }
        else {
            removeChar(parentheses, n, answers);
        }
        n++;
    }
    logging.success(`${JSON.stringify(answers.filter((v, i, self) => {
        return self.indexOf(v) === i;
    }))}`);
    return answers.filter((v, i, self) => {
        return self.indexOf(v) === i;
    });
}
// "Find All Valid Math Expressions"
// You are given a string which contains only digits between 0 and 9 as well as a target
// number. Return all possible ways you can add the +, -, and * operators to the string
// of digits such that it evaluates to the target number.
// The answer should be provided as an array of strings containing the valid expressions.
// NOTE: Numbers in an expression cannot have leading 0’s
// Examples:
// Input: digits = “123”, target = 6
// Output: [1+2+3, 1*2*3]
// Input: digits = “105”, target = 5
// Output: [1*0+5, 10-5]
function FindValidMathExpressions(ns, data) {
    function helper(res, path, num, target, pos, evaluated, multed) {
        if (pos === num.length) {
            if (target === evaluated) {
                res.push(path);
            }
            return;
        }
        for (let i = pos; i < num.length; ++i) {
            if (i != pos && num[pos] == "0") {
                break;
            }
            const cur = parseInt(num.substring(pos, i + 1));
            if (pos === 0) {
                helper(res, path + cur, num, target, i + 1, cur, cur);
            }
            else {
                helper(res, path + "+" + cur, num, target, i + 1, evaluated + cur, cur);
                helper(res, path + "-" + cur, num, target, i + 1, evaluated - cur, -cur);
                helper(res, path + "*" + cur, num, target, i + 1, evaluated - multed + multed * cur, multed * cur);
            }
        }
    }
    if (Array.isArray(data)) {
        const num = asString(data[0]);
        const target = asNumber(data[1]);
        if (num == null || num.length === 0) {
            return [];
        }
        const result = [];
        helper(result, "", num, target, 0, 0, 0);
        logging.success(`${Array.from(result)}`);
        return result;
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
// You are given the following encoded binary String:
// '01010101000'
// Treat it as a Hammingcode with 1 'possible' error on an random Index.
// Find the 'possible' wrong bit, fix it and extract the decimal value, which is hidden inside the string.
// Note: The length of the binary string is dynamic, but it's encoding/decoding is following Hammings 'rule'
// Note 2: Index 0 is an 'overall' parity bit. Watch the Hammingcode-video from 3Blue1Brown for more information
// Note 3: There's a ~55% chance for an altered Bit. So... MAYBE there is an altered Bit 😉
// Extranote for automation: return the decimal value as a string
function HammingBtoI(ns, data) {
    const bin2Dec = function (bin) {
        return parseInt(bin, 2);
    };
    if (typeof data === 'string') {
        const binary = data;
        const bits = [];
        for (const c of binary) {
            bits.push(c === '1' ? 1 : 0);
        }
        const err = bits.map((v, i) => { return v > 0 ? i : 0; }).reduce((p, c) => { return p ^ c; });
        if (err > 0) {
            logging.info(`error at ${err}`);
            bits[err] = (bits[err] === 1) ? 0 : 1;
        }
        else {
            logging.info('no error detected.');
        }
        for (let bit = bits.length - 1; bit >= 0; bit--) {
            if ((bit & (bit - 1)) === 0) {
                bits.splice(bit, 1);
            }
        }
        logging.info(`remaining bits: ${bits.join('')}`);
        const integer = bin2Dec(bits.join(''));
        logging.success(`integer value: ${integer}`);
        return [`${integer}`];
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
function runLengthEncoding(ns, data) {
    if (typeof data === 'string') {
        const dataArray = [...data];
        logging.info(data);
        const rlPairs = dataArray.reduce((prev, curr) => {
            if (prev.length === 0 || curr !== prev[prev.length - 1].char) {
                prev.push({ char: curr, count: 1 });
                return prev;
            }
            else {
                prev[prev.length - 1] = { char: curr, count: prev[prev.length - 1].count + 1 };
                return prev;
            }
        }, []);
        logging.info(`${rlPairs}`);
        let retData = "";
        while (rlPairs.length > 0) {
            if (rlPairs[0].count > 9) {
                retData = `${retData}9${rlPairs[0].char}`;
                rlPairs[0].count = rlPairs[0].count - 9;
            }
            else {
                retData = `${retData}${rlPairs[0].count}${rlPairs[0].char}`;
                rlPairs.splice(0, 1);
            }
        }
        logging.success(retData);
        return [retData];
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}
function lzDecompression(ns, data) {
    if (typeof data === 'string') {
        logging.info(data);
        const datArr = [...data];
        let ret = "";
        while (datArr.length > 0) {
            //copy
            const count = parseInt(datArr.splice(0, 1)[0]);
            if (count !== 0) {
                ret = ret + datArr.splice(0, count).join('');
                if (datArr.length === 0) {
                    break;
                }
            }
            //ref
            const count2 = parseInt(datArr.splice(0, 1)[0]);
            if (count !== 0) {
                const pos = parseInt(datArr.splice(0, 1)[0]);
                for (let i = 0; i < count2; i++) {
                    ret = ret + ret[ret.length - pos - 1];
                }
            }
        }
        logging.success(ret);
        // return [ret]
    }
    throw new Error("Unexpected data types Unable to solve contract.");
}

const solveContractPath = "/contracts/solveContract.js";
const processors = new Map([
    ["Find Largest Prime Factor", largestPrimeFactor],
    ["Subarray with Maximum Sum", MaxSubArray],
    ["Total Ways to Sum", TotalSums],
    ["Total Ways to Sum II", TotalSums2],
    ["Spiralize Matrix", SpiralMatrix],
    ["Array Jumping Game", ArrayJump],
    ["Array Jumping Game II", ArrayJump2],
    ["Merge Overlapping Intervals", MergeOverlapping],
    ["Generate IP Addresses", GenerateIPAddresses],
    ["Algorithmic Stock Trader I", StockTrader1],
    ["Algorithmic Stock Trader II", StockTrader2],
    ["Algorithmic Stock Trader III", StockTrader3],
    ["Algorithmic Stock Trader IV", StockTrader4],
    ["Minimum Path Sum in a Triangle", MinTrianglePath],
    ["Unique Paths in a Grid I", UniquePath1],
    ["Unique Paths in a Grid II", UniquePath2],
    ["Sanitize Parentheses in Expression", SanitizeParentheses],
    ["Find All Valid Math Expressions", FindValidMathExpressions],
    ["HammingCodes: Encoded Binary to Integer", HammingBtoI],
    // ["HammingCodes: Integer to encoded Binary",HammingItoB],        //Strings
    ["Compression I: RLE Compression", runLengthEncoding],
    ["Compression II: LZ Decompression", lzDecompression],
    // ["Compression III: LZ Compression",lzCompression],              //Strings   
    ["Proper 2-Coloring of a Graph", colorGraph], //Paths    DONE
]);
async function main(ns) {
    await initLogging(ns);
    const usage = `solveContract.ts USAGE: ${solveContractPath} <contract filename> <host>`;
    if (ns.args.length != 2) {
        logging.error(`Invalid number of arguments`);
        logging.info(usage);
        ns.exit();
    }
    const filename = asString(ns.args[0]);
    const host = asString(ns.args[1]);
    if (!ns.codingcontract.getContractType(filename, host)) {
        logging.error(`Invalid file ${host}:${filename}`);
        logging.info(usage);
        ns.exit();
    }
    const type = ns.codingcontract.getContractType(filename, host);
    const data = ns.codingcontract.getData(filename, host);
    try {
        const answer = processors.get(type)?.(ns, data);
        if (answer !== undefined) {
            const result = ns.codingcontract.attempt(answer, filename, host, { returnReward: true });
            if (result === "") {
                logging.error(`Failed Contract: ${host}.${filename} - '${type}'`, true);
                ns.spawn(unsolveableContractPath, 1, "--file", filename, "--host", host);
            }
            else {
                logging.success(`${result}`, true);
                await ns.write("solvedContracts.txt", [type, data, answer, "\n"], 'a');
            }
        }
        else {
            logging.warning(`unable to process contract: ${host}.${filename} - '${type}'`, true);
            ns.spawn(unsolveableContractPath, 1, "--file", filename, "--host", host);
        }
    }
    catch (e) {
        if (typeof e === "string") {
            logging.error(e, true);
        }
        else if (e instanceof Error) {
            logging.error(e.message, true);
        }
    }
}

export { main, solveContractPath };
