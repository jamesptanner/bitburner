import { NS } from '@ns';
import { IDBPDatabase } from 'idb';
import { MetricTable } from '../shared/logging';
import { getLoggingDB, initLogging, LogData, LoggingDB, LoggingPayload, LoggingTable } from "/shared/logging";
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
        if (d === ""){
            return new LoggingSettings()
        }
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

const sendTrace = async function (ns: NS, settings: LoggingSettings, payloads: LoggingPayload[]): Promise<boolean> {
    if (payloads.length === 0) {
        return true
    }

    if ("key" in payloads[0].payload) {
        // const tags = `;trace=${payload.trace};host=${payload.host};script=${payload.script}`
        for (const payload of payloads) {
            if ("key" in payload.payload) {

                const metricName = `bitburner.${settings.gameHost}.${payload.payload.key}`;
                const request = graphiteRequest;
                request.body = `${metricName} ${payload.payload.value} ${Math.floor(payload.timestamp / 1e9)}\n`;

                const response = await fetch(graphiteUrl, request);
                if (!response.ok) {
                    ns.tprint(`ERROR: Failed to send metric to graphite. HTTP code: ${response.status}`);
                    return false
                } else {
                    // ns.print("Send Successful.");
                }
            }
        }
        return true
    }
    return false
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

async function trimRecords(ns: NS, loggingDB: IDBPDatabase<LoggingDB>): Promise<void> {
    ns.print(`Tidying up records`)
    const deleteTime = (Date.now() - 6 * 60 * 60 * 1000) * 1e6 //drop older than 6hrs converted to nanosec

    const loggingTX = loggingDB.transaction('logging', 'readwrite')
    const loggingIndex = loggingTX.store.index('timestamp')
    const loggingRecords = await loggingIndex.count(IDBKeyRange.upperBound(deleteTime, false))
    ns.print(`Deleting ${loggingRecords} from logging table`)
    if (loggingRecords > 0) {
        let cursor = await loggingIndex.openCursor(IDBKeyRange.upperBound(deleteTime, false))
        while (cursor !== null){
            await cursor.delete()
            cursor = await cursor.continue()
        }
    }
    await loggingTX.done

    const metricTX = loggingDB.transaction('metrics', 'readwrite')
    const metricIndex = metricTX.store.index('timestamp')
    const metricRecords = await metricIndex.count(IDBKeyRange.upperBound(deleteTime, false))
    ns.print(`Deleting ${metricRecords} from metrics table`)
    if (metricRecords > 0) {
        let cursor = await metricIndex.openCursor(IDBKeyRange.upperBound(deleteTime, false))
        while (cursor !== null){
            await cursor.delete()
            cursor = await cursor.continue()
        }
    }
    await metricTX.done

}

export async function main(ns: NS): Promise<void> {
    const loggingSettings = await checkLoggingSettings(ns)
    setupLoki(loggingSettings)
    setupGraphite(loggingSettings)

    await initLogging(ns)
    const loggingDB = getLoggingDB()

    await trimRecords(ns, loggingDB)
    while (true) {
        try{
            let start = Date.now()
            await sendLogs(loggingDB, ns, loggingSettings, LoggingTable, sendLog);
            ns.print(`time taken: ${ns.tFormat(Date.now() - start)}`)
            start = Date.now()
            await sendLogs(loggingDB, ns, loggingSettings, MetricTable, sendTrace)
            ns.print(`time taken: ${ns.tFormat(Date.now() - start)}`)
        }
        catch(e){
            ns.print(`failed to send log: ${e}`)
        }
        await ns.sleep(500)
    }
}

async function sendLogs(loggingDB: IDBPDatabase<LoggingDB>, ns: NS, loggingSettings: LoggingSettings,
    table: "logging" | "metrics",
    sender: (ns: NS, settings: LoggingSettings, payload: LoggingPayload[]) => Promise<boolean>): Promise<void> {
    const lineCount = await loggingDB.transaction(table, 'readonly').store.count()
    ns.print(`${lineCount} ${table} transactions queued.`)
    await sendTrace(ns,loggingSettings,[new LoggingPayload(ns.getHostname(), ns.getScriptName(), "641f4573-9d96-4c77-a703-cd6324cce93c", {
            key: `logging.${table}.count`,
            value: lineCount,
        })])
    if (lineCount === 0) {
        return new Promise<void>((res) => { res() })
    }
    const logLinesGetAll = await loggingDB.transaction(table, 'readonly').store.getAll(null, 3000);

    const linesByTrace = new Map<string, [LoggingPayload[], number[]]>()

    logLinesGetAll.map(x => x.trace).filter(unique).forEach(trace => {
        const lines = logLinesGetAll.filter(v => { return v.trace === trace })
        const keys = lines.map(line => line.timestamp)
        linesByTrace.set(trace, [lines, keys])
    })
    const traceSuccessful = new Map<string, boolean>()
    for (const trace of linesByTrace) {
        if (trace[1][0].length > 0) {
            traceSuccessful.set(trace[0], await sender(ns, loggingSettings, trace[1][0]))
        }
    }
    const toDelete: number[] = []
    for (const trace of linesByTrace) {
        if (traceSuccessful.get(trace[0]) && trace[1][1].length > 0) {
            for (const index of trace[1][1]) {
                let cursor = await loggingDB.transaction(table, 'readonly').store.index("timestamp").openCursor(index)
                while (cursor) {
                    toDelete.push(cursor.primaryKey)
                    cursor = await cursor.continue()
                }
            }
        }
    }

    const deletes: Promise<unknown>[] = []
    const tx = loggingDB.transaction(table, 'readwrite')
    toDelete.filter(unique).forEach(primaryKey => {
        deletes.push(tx.store.delete(primaryKey))
    })
    deletes.push(tx.done)
    return Promise.all(deletes)
        .then(x => {
            ns.print(`${x.length - 1} ${table} transactions completed.`)
        })
        .catch(x =>
            ns.print(`failed to delete: ${x}`)
        )

}
