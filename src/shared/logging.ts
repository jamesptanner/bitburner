import { notStrictEqual } from "assert";
import { randomUUID } from "crypto";
import { NS, NetscriptPort } from "@ns";
import { keyBy } from "lodash";

enum Level {
    Error,
    Warning,
    Info,
    success,
}

type LogData = {
    level: Level
    message: string
}

type MetricData = {
    Key: string
    value: number | string
}


class LoggingPayload {
    trace: string | undefined;
    payload: MetricData | LogData | undefined

    constructor(trace?: string, payload?: MetricData | LogData) {
        this.trace = trace
        this.payload = payload
    }

    static fromJSON(d: unknown): LoggingPayload {
        return Object.assign(new LoggingPayload(), d)
    }
}

const LOGGING_PORT = 1;
const loggingTrace = randomUUID();
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

    const logPayload = new LoggingPayload(loggingTrace, {
        level: level,
        message: logString,
    })
    let attempts = 0
    while (!portHandle.tryWrite(JSON.stringify(logPayload)) && attempts < 3) {
        attempts++
    }
};

export const sendMetric = function (key:string, value:string) {
    const logPayload = new LoggingPayload(loggingTrace, {
        Key:key,
        value:value
    })
    let attempts = 0
    while (!portHandle.tryWrite(JSON.stringify(logPayload)) && attempts < 3) {
        attempts++
    }
};
