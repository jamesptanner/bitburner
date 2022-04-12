import { NS } from '@ns'
import { getLoggingDB, LoggingPayload, LoggingTable, initLogging, LogData } from "/shared/logging";
import { MetricTable } from '../shared/logging';
import { IDBPDatabase } from 'idb';
import { unique } from '/shared/utils';

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
        // const tags = `;trace=${payload.trace};host=${payload.host};script=${payload.script}`

        const metricName = `bitburner.${settings.gameHost}.${payload.payload.key}`;
        const request = graphiteRequest;
        request.body = `${metricName} ${payload.payload.value} ${Math.floor(Date.now() / 1000)}\n`;

        const response = await fetch(graphiteUrl, request);
        if (!response.ok) {
            ns.tprint(`ERROR: Failed to send metric to graphite. HTTP code: ${response.status}`);
        } else {
            // ns.print("Send Successful.");
        }
    }
}

const sendLog = async function (ns: NS, settings: LoggingSettings, payload: LoggingPayload[]): Promise<boolean> {
    if (payload.length === 0) {
        return true
    }

    if ("message" in payload[0].payload) {
        const values = payload.map(payload => [`${payload.timestamp}`, (payload.payload as LogData).message])
        const request = lokiRequest
        const body = {
            "streams": [
                {
                    "stream": {
                        "trace": payload[0].trace,
                        "host": payload[0].host,
                        "script": payload[0].script,
                        "game": settings.gameHost,
                        "level": payload[0].payload.level
                    },
                    "values": values
                }
            ]
        }
        request.body = JSON.stringify(body)

        const response = await fetch(lokiUrl, request)
        if (!response.ok) {
            ns.tprint(`ERROR: Failed to send logging to loki. HTTP code: ${response.status}`)
        }
        else {
            // ns.print("Send Successful.")
        }
        return response.ok
    }
    return false
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
    const loggingSettings = await checkLoggingSettings(ns)
    setupLoki(loggingSettings)
    setupGraphite(loggingSettings)

    await initLogging(ns)
    const loggingDB = getLoggingDB()
    while (true) {
        await sendLogs(loggingDB, ns, loggingSettings);

        // const metrics = new Map<IDBValidKey, string>()
        // let metricCursor = await loggingDB.transaction(MetricTable, 'readonly').store.openCursor()
        // while (metricCursor != null && metrics.size < 5000) {
        //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        //     metrics.set(metricCursor!.primaryKey, metricCursor!.value as string)
        //     // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        //     metricCursor = await metricCursor!.continue()
        // }
        // for (const metric of metrics) {
        //     const payload = LoggingPayload.fromJSON(JSON.stringify(metric[1]))
        //     if ("key" in payload.payload) {
        //         await sendTrace(ns, loggingSettings, payload)
        //     }

        //     const tx = loggingDB.transaction(MetricTable, 'readwrite')
        //     await tx.store.delete(metric[0])
        //     tx.commit()
        //     if ((metric[0] as number) % 10 === 0) {
        //         ns.print(`sent metric ${metric[0]}`)
        //     }
        // }


        await ns.sleep(100)
    }
}

async function sendLogs(loggingDB: IDBPDatabase, ns: NS, loggingSettings: LoggingSettings) {
    const logLinesGetAll = await loggingDB.transaction(LoggingTable, 'readonly').store.getAll(null, 5000) as LoggingPayload[];
    const linesByTrace = new Map<string, [LoggingPayload[], number[]]>()

    logLinesGetAll.map(x => x.trace).filter(unique).forEach(trace => {
        const lines = logLinesGetAll.filter(v => { return v.trace === trace })
        const keys = lines.map(line => line.timestamp)
        linesByTrace.set(trace, [lines, keys])
    })
    const traceSuccessful = new Map<string,boolean>()
    for (const trace of linesByTrace) {
        if (trace[1][0].length > 0) {
            console.log(`${trace[1][0]}`)
            traceSuccessful.set(trace[0],await sendLog(ns, loggingSettings, trace[1][0]))
        }
    }
    const tx = loggingDB.transaction(LoggingTable, 'readwrite')
    const deletes: Promise<unknown>[] = []
    for (const trace of linesByTrace) {
        if ( traceSuccessful.get(trace[0]) && trace[1][1].length > 0) {
            trace[1][1].forEach(index => {
                deletes.push(tx.store.index('timestamp').objectStore.delete(index))
            })
        }
    }
    deletes.push(tx.done)
    await Promise.all(deletes)
    .then(x => 
        console.log(`all good?: ${x}`))
    .catch(x =>
        console.log(`failed to delete: ${x}`)
        )

}
