import { NS } from "@ns";
import { OpenIDB, IDBPDatabase } from "lib/idb";

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
    args: string
    trace: string
    timestamp: number
    payload: MetricData | LogData
    constructor(host?: string, script?: string, trace?: string, payload?: MetricData | LogData, args?: string) {

        this.host = host ? host: "UNKNOWN";
        this.script = script ? script: "UNKNOWN";
        this.trace = trace ? trace: "UNKNOWN";
        this.payload = payload ? payload: {level:Level.Error, message:"UNKNOWN"};
        this.args = args? args: "";

        this.timestamp = (Date.now())*1000000
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

export class Logging {

    private loggingTrace = generateUUID();
    private n: NS;

    // const DBVERSION = 1
    // export const LoggingTable = "logging"
    // export const MetricTable = "metrics"

    // private loggingDB: IDBPDatabase

    constructor(ns: NS){
        this.n = ns;
        // loggingDB = await OpenIDB("BBLogging",DBVERSION,{
        //     upgrade(db,prevVersion){
        //         if(prevVersion < 1){
        //             const loggingStore = db.createObjectStore(LoggingTable, {autoIncrement:true})
        //             loggingStore.createIndex("timestamp","timestamp",{unique:false})
        //             const metricStore = db.createObjectStore(MetricTable,{autoIncrement:true})
        //             metricStore.createIndex("timestamp","timestamp",{unique:false})
        //         }
        //     }
        // })
        ns.disableLog('ALL')
        ns.clearLog()
        return this;
    };

    private levelToString(level: Level): string {
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

    private levelToToast(level: Level): "success" | "warning" | "error" | "info" | undefined {
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

    public log(level: Level, msg: string, toast?: boolean): void {
        if(this.n){
            if (toast) {
                this.n.toast(`${this.levelToString(level)}: ${msg}`, this.levelToToast(level));
            }
            this.n.print(`${this.levelToString(level)}: ${msg}`);
            // const logPayload = new LoggingPayload(n.getHostname(), n.getScriptName(), loggingTrace, {
            //     level: level,
            //     message: msg,
            // }, n.args.toString())
            // const tx = loggingDB.transaction(LoggingTable,'readwrite')
            // tx.putAndForget(logPayload);
            // tx.commit();
        }
        else{
            throw new Error("Logging not initalised");
        } 

    };

    public success(msg: string, toast?: boolean): void {
        this.log(Level.success, msg, toast)
    };
    public info(msg: string, toast?: boolean): void {
        this.log(Level.Info, msg, toast)
    };
    public  warning(msg: string, toast?: boolean): void {
        this.log(Level.Warning, msg, toast)
    };
    public error(msg: string, toast?: boolean): void {
        this.log(Level.Error, msg, toast)
    };

    public sendMetric(key: string, value: number): void {

        if (!isNaN(value)){
            this.info(`Metric ${key}: ${value}`)
            // const logPayload = new LoggingPayload(n.getHostname(), n.getScriptName(), loggingTrace, {
            //     key: key,
            //     value: value,
            // }, n.args.toString());
            
            // const tx = loggingDB.transaction(MetricTable,'readwrite');
            // tx.putAndForget(logPayload);
            // tx.commit();
        }
    };
}