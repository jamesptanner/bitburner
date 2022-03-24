import { NS, NetscriptPort } from "@ns";
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
    host:string
    script:string
    trace: string 
    timestamp:number
    payload: MetricData | LogData

    constructor(host?: string, script?: string, trace?: string, payload?: MetricData | LogData) {
        if(host)this.host = host
        if(script)this.script = script
        if(trace)this.trace = trace
        if(payload)this.payload = payload
        this.timestamp = Date.now()*1000000
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
    let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now()*1000)) || 0;//Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        let r = Math.random() * 16;//random number between 0 and 16
        if(d > 0){//Use timestamp until depleted
            r = (d + r)%16 | 0;
            d = Math.floor(d/16);
        } else {//Use microseconds since page-load if supported
            r = (d2 + r)%16 | 0;
            d2 = Math.floor(d2/16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

export const LOGGING_PORT = 1;
const loggingTrace = generateUUID();
let n: NS;
let portHandle: NetscriptPort;

export const initLogging = function (ns: NS): void {
    n = ns;
    portHandle = ns.getPortHandle(LOGGING_PORT);
};

const levelToString = function (level: Level): string {
    switch (level) {
        case Level.Error:
            return "Error";
        case Level.Info:
            return "Info";
        case Level.Warning:
            return "Warn";
        case Level.success:
            return "Success";
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

export const log = function (level: Level, msg: string, toast?: boolean | null): void {
    const logString = `${levelToString(level)}: ${msg}`;
    if (toast) {
        n.toast(logString, levelToToast(level));
    }
    n.print(logString);

    const logPayload = new LoggingPayload(n.getHostname(),n.getScriptName(),loggingTrace, {
        level: level,
        message: logString,
    })
    let attempts = 0
    while (!portHandle.tryWrite(JSON.stringify(logPayload)) && attempts < 3) {
        attempts++
    }
};

export const sendMetric = function (key:string, value:string) {
    const logPayload = new LoggingPayload(n.getHostname(),n.getScriptName(),loggingTrace, {
        key:key,
        value:value
    })
    let attempts = 0
    while (!portHandle.tryWrite(JSON.stringify(logPayload)) && attempts < 3) {
        attempts++
    }
};
