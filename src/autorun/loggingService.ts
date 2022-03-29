import { NS } from '@ns'
import { hostname } from 'os';
import { LogData, MetricData, LoggingPayload, LOGGING_PORT, Level } from '/shared/logging';
// import GraphiteClient from 'graphite'

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

let graphiteUrl: string;
let graphiteRequest: RequestInit;

const setupGraphite = function (settings: LoggingSettings) {
    graphiteUrl = `${settings.metricHost}/`
    graphiteRequest = {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        }
    }

}

const sendTrace = async function (ns: NS, settings: LoggingSettings, payload: LoggingPayload): Promise<void> {
    if ("key" in payload.payload) {
        const tags = `;trace=${payload.trace};host=${payload.host};script=${payload.script}`

        const metricName = `bitburner.${settings.gameHost}.${payload.payload.key}`
        const request = graphiteRequest
        request.body = `${metricName} ${payload.payload.value} ${Math.floor(Date.now() / 1000)}\n`

        const response = await fetch(graphiteUrl, request)
        if (!response.ok) {
            ns.tprint(`ERROR: Failed to send metric to graphite. HTTP code: ${response.status}`)
        }
        else {
            ns.print("Send Successful.")
        }

    }
}

const sendLog = async function (ns: NS, settings: LoggingSettings, payload: LoggingPayload): Promise<void> {
    if ("message" in payload.payload) {
        const request = lokiRequest
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
        }
        request.body = JSON.stringify(body)

        const response = await fetch(lokiUrl, request)
        if (!response.ok) {
            ns.tprint(`ERROR: Failed to send logging to loki. HTTP code: ${response.status}`)
        }
        else {
            ns.print("Send Successful.")
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
        const host = await ns.prompt("Enter metric server host address (http://graphite.example.org:2003)", { type: "text" })
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
            if (typeof portPayload === 'number') {
                ns.tprint(`Payload unknown type.`)
                ns.exit()
                return
            }
            const payload = LoggingPayload.fromJSON(portPayload)
            if ("message" in payload.payload) {
                await sendLog(ns, loggingSettings, payload)
            }
            else if ("key" in payload.payload) {
                await sendTrace(ns, loggingSettings, payload)
            }
        }
        await ns.sleep(500)
    }
}