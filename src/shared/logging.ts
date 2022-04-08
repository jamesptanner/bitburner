import { NS, NetscriptPort } from "@ns";
import { createBrotliDecompress } from "zlib";
export enum Level {
    Error,
    Warning,
    Info,
    success,
}

export type LogData = {
    level: Level
    message: string
}

export type MetricData = {
    key: string
    value: number | string
}


export class LoggingPayload {
    host: string
    script: string
    trace: string
    timestamp: number
    payload: MetricData | LogData

    constructor(host?: string, script?: string, trace?: string, payload?: MetricData | LogData) {
        if (host) this.host = host
        if (script) this.script = script
        if (trace) this.trace = trace
        if (payload) this.payload = payload
        this.timestamp = Date.now() * 1000000
    }

    static fromJSON(d: string): LoggingPayload {
        return Object.assign(new LoggingPayload(), JSON.parse(d))
    }
}

//from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid.
//cant import crypto so this should do.
//TODO keep an eye out for something better.
function generateUUID() { // Public Domain/MIT
    let d = new Date().getTime();//Timestamp
    let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16;//random number between 0 and 16
        if (d > 0) {//Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

export const LOGGING_PORT = 1;
const loggingTrace = generateUUID();
let n: NS;
let portHandle: NetscriptPort;

const DBVERSION = 1
const LoggingTable = "logging"
const MetricTable = "metrics"

let loggingDB: IDBDatabase

const createDB = function (ns: NS, event: IDBVersionChangeEvent) {
    const db: IDBDatabase = event.target.result
    const prevVersion = event.oldVersion
    const newVersion = event.newVersion

    if(prevVersion < 1){
        const loggingStore = db.createObjectStore(LoggingTable, {autoIncrement:true})
        loggingStore.createIndex("timestamp","timestamp",{unique:false})
        const metricStore = db.createObjectStore(MetricTable,{autoIncrement:true})
        metricStore.createIndex("timestamp","timestamp",{unique:false})
    }
}


export const initLogging = function (ns: NS): void {
    n = ns;
    portHandle = ns.getPortHandle(LOGGING_PORT);
    const eval2 = eval
    const win: Window = eval2('window')
    const loggingDBRequest = win.indexedDB.open("BBlogging", DBVERSION)

    loggingDBRequest.onsuccess = event => {
        loggingDB = event.target.result
        loggingDB.onerror = event => {
            ns.tprint(`database error: ${event.target.code}`)
        }
    }
    loggingDBRequest.onerror = event => {
        ns.tprint(`Unable to open loggingdb: ${event.target.code}`)
    }

    loggingDBRequest.onupgradeneeded = event => {
        createDB(ns, event)
    }



};

const levelToString = function (level: Level): string {
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

const levelToToast = function (level: Level): string {
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
    return "";
};

export const log = function (level: Level, msg: string, toast?: boolean): void {
    if (toast) {
        n.toast(`${levelToString(level)}: ${msg}`, levelToToast(level));
    }
    n.print(`${levelToString(level)}: ${msg}`);

    const logPayload = new LoggingPayload(n.getHostname(), n.getScriptName(), loggingTrace, {
        level: level,
        message: msg,
    })
    let attempts = 0
    // const transaction = loggingDB.transaction([LoggingTable],"readwrite")
    // transaction.oncomplete = event => {
    //     console.log("store Complete")
    // }

    // transaction.onerror = event =>{
    //     console.log("failed to store logging")

    // }
    // const loggingStore = transaction.objectStore(LoggingTable)
    // loggingStore.add(logPayload)
    // transaction.commit()
    while (!portHandle.tryWrite(JSON.stringify(logPayload)) && attempts < 3) {
        attempts++
    }
};

export const success = function (msg: string, toast?: boolean): void {
    log(Level.success, msg, toast)
};
export const info = function (msg: string, toast?: boolean): void {
    log(Level.Info, msg, toast)
};
export const warning = function (msg: string, toast?: boolean): void {
    log(Level.Warning, msg, toast)
};
export const error = function (msg: string, toast?: boolean): void {
    log(Level.Error, msg, toast)
};

export const sendMetric = function (key: string, value: string | number): void {
    const logPayload = new LoggingPayload(n.getHostname(), n.getScriptName(), loggingTrace, {
        key: key,
        value: value,
    });
    let attempts = 0;
    while (!portHandle.tryWrite(JSON.stringify(logPayload)) && attempts < 3) {
        attempts++;
    }
};

export const addMetricToBatch = function (key: string, value: string | number): void {
    const logPayload = new LoggingPayload(n.getHostname(), n.getScriptName(), loggingTrace, {
        key: key,
        value: value,
    });
    // loggingBatch.push(logPayload)
};


export const logging = {
    log: log,
    error: error,
    warning: warning,
    success: success,
    info: info
}