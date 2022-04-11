import { NS } from '@ns'
import { getLoggingDB, LoggingPayload, LoggingTable, initLogging,LogData } from "/shared/logging";
import { MetricTable } from '../shared/logging';
import { IDBPDatabase } from 'idb';
import { unique } from '/shared/utils';
import { GangMemberAscension } from './../../NetscriptDefinitions.d';

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

const sendLog = async function (ns: NS, settings: LoggingSettings, payload: LoggingPayload[]): Promise<void> {
    if(payload.length === 0){
        return
    }
    
    if ("message" in payload[0].payload) {
        const values = payload.map(payload => [payload.timestamp,(payload.payload as LogData).message])
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
    const loggingSettings = await checkLoggingSettings(ns)
    setupLoki(loggingSettings)
    setupGraphite(loggingSettings)

    await initLogging(ns)
    const loggingDB = getLoggingDB()
    while (true) {
        await sendLogs(loggingDB, ns, loggingSettings);

        const metrics = new Map<IDBValidKey, string>()
        let metricCursor = await loggingDB.transaction(MetricTable, 'readonly').store.openCursor()
        while (metricCursor != null&& metrics.size < 5000) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            metrics.set(metricCursor!.primaryKey, metricCursor!.value as string)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            metricCursor = await metricCursor!.continue()
        }
        for (const metric of metrics) {
            const payload = LoggingPayload.fromJSON(JSON.stringify(metric[1]))
            if ("key" in payload.payload) {
                await sendTrace(ns, loggingSettings, payload)
            }

            const tx = loggingDB.transaction(MetricTable, 'readwrite')
            await tx.store.delete(metric[0])
            tx.commit()
            if((metric[0] as number )%10 === 0){
                ns.print(`sent metric ${metric[0]}`)
            }
        }


        await ns.sleep(1)
    }
}

async function sendLogs(loggingDB:IDBPDatabase, ns: NS, loggingSettings: LoggingSettings) {
    const logLines = new Map<IDBValidKey, string>();
    const logLinesGetAll = await loggingDB.transaction(LoggingTable, 'readonly').store.getAll(null,5000) as LoggingPayload[];
    console.log(`${logLinesGetAll}`)
    let logLineCursor = await loggingDB.transaction(LoggingTable, 'readonly').store.openCursor();

    while (logLineCursor != null && logLines.size < 5000) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion 
        logLines.set(logLineCursor!.primaryKey, logLineCursor!.value as string);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        logLineCursor = await logLineCursor!.continue();
    }
    
    const linesByTrace = new Map<string,LoggingPayload[]>()
    
     logLinesGetAll.map(x => x.trace).filter(unique).forEach(trace =>{
        linesByTrace.set(trace,logLinesGetAll.filter(v=>{return v.trace===trace}))
     })
    
     for(const trace of linesByTrace){
         await sendLog(ns,loggingSettings,trace[1])
     }

    // for (const logline of logLines) {
    //     const payload = LoggingPayload.fromJSON(JSON.stringify(logline[1]));
    //     if ("message" in payload.payload) {
    //         await sendLog(ns, loggingSettings, [payload]);
    //     }
    //     const tx = loggingDB.transaction(LoggingTable, 'readwrite');
    //     await tx.store.delete(logline[0]);
    //     tx.commit();
    //     if ((logline[0] as number) % 10 === 0) {
    //         ns.print(`sent log ${logline[0]}`);
    //     }
    // }
}
