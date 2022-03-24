import { NS } from '@ns'
import { hostname } from 'os';
import { LogData, MetricData, LoggingPayload, LOGGING_PORT, Level } from '/shared/logging';

export const loggingServicePath = "/autorun/loggingService.js";

class LoggingSettings {
    gameHost: string
    loggingHost: string
    metricHost: string
    constructor(gameHost?: string, loggingHost?: string, metricHost?: string) {
        if (gameHost) this.gameHost = gameHost
        if (loggingHost) this.loggingHost = loggingHost
        if (metricHost) this.metricHost = metricHost
    }
    static fromJSON(d: string): LoggingSettings {
        return Object.assign(new LoggingSettings(), JSON.parse(d))
    }
}

const sendTrace = async function (ns:NS, timestamp: number, traceId: string, metric: MetricData): Promise<void> {

}

const sendLog = async function (ns:NS, payload: LoggingPayload): Promise<void> {
    if ("message" in payload.payload) {
        const request = lokiRequest
        const body = {
            "streams": [
                {
                    "stream": {
                        "trace": payload.trace,
                        "host": payload.host,
                        "script": payload.script
                    },
                    "values": [
                        [payload.timestamp, payload.payload.message]
                    ]
                }
            ]
        }
        request.body = JSON.stringify(body)

        const response = await fetch(lokiUrl,request)
        if (!response.ok) { 
            ns.tprint(`ERROR: Failed to send logging to loki. HTTP code: ${response.status}`)
        }
    }
}

let lokiUrl: string
let lokiRequest: RequestInit
const setupLoki = function (settings: LoggingSettings) {
    lokiUrl = `${settings.loggingHost}/loki/api/v1/push`
    lokiRequest = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
}

const setupGraphite = function (settings: LoggingSettings) {

}

const loggingSettingsFile = "loggingSettings.txt";

const checkLoggingSettings = async function (ns: NS): Promise<LoggingSettings> {
    const settings = LoggingSettings.fromJSON(ns.read(loggingSettingsFile) as string)
    let saveSettings = false
    if (!settings.gameHost) {
        saveSettings = true
        const host = await ns.prompt("Enter Game Identifier", { type: "text" })
        if (typeof host === 'string') settings.gameHost = host
    }

    if (!settings.loggingHost) {
        saveSettings = true
        const host = await ns.prompt("Enter Logging server host address (http://loki.example.org:3100)", { type: "text" })
        if (typeof host === 'string') settings.loggingHost = host
    }

    if (!settings.metricHost) {
        saveSettings = true
        const host = await ns.prompt("Enter metric server host address (graphite.example.org:2003)", { type: "text" })
        if (typeof host === 'string') settings.metricHost = host
    }

    if (saveSettings) {
        await ns.write(loggingSettingsFile, JSON.stringify(settings), "w")
    }
    return settings
}

export async function main(ns: NS): Promise<void> {
    const port = ns.getPortHandle(LOGGING_PORT)
    const loggingSettings = await checkLoggingSettings(ns)
    setupLoki(loggingSettings)
    setupGraphite(loggingSettings)
    while (true) {
        while (!port.empty()) {
            const portPayload = port.read()
            if(typeof portPayload==='number'){
                ns.tprint(`Playload unknown type.`)
                ns.exit()
                return
            }
            const payload = LoggingPayload.fromJSON(portPayload)
            if ("message" in payload.payload) {
                await sendLog(ns, payload)
            }
            else if ("key" in payload.payload) {
                await sendTrace(ns, payload.timestamp, payload.trace, payload.payload)
            }
        }
        await ns.sleep(100)
    }
}