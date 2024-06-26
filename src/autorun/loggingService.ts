import { NS } from "@ns";
import {
  LogData,
  Logging,
  LoggingPayload,
  LoggingTable,
  MetricTable,
} from "/shared/logging";
import { IDBPDatabase, wrapIDBRequest } from "/lib/idb";

export const loggingServicePath = "/autorun/loggingService.js";

class LoggingSettings {
  gameHost: string;
  loggingHost: string;
  metricHost: string;
  constructor(gameHost?: string, loggingHost?: string, metricHost?: string) {
    this.gameHost = gameHost ? gameHost : "";
    this.loggingHost = loggingHost ? loggingHost : "";
    this.metricHost = metricHost ? metricHost : "";
  }
  static fromJSON(d: string): LoggingSettings {
    if (d === "") {
      return new LoggingSettings();
    }
    return Object.assign(new LoggingSettings(), JSON.parse(d));
  }
}

let graphiteUrl: string;
let graphiteRequest: RequestInit;

const setupGraphite = function (settings: LoggingSettings) {
  graphiteUrl = `${settings.metricHost}/`;
  graphiteRequest = {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
  };
};

const sendTrace = async function (
  ns: NS,
  settings: LoggingSettings,
  payload: LoggingPayload,
): Promise<boolean> {
  if ("key" in payload.payload) {
    // const tags = `;trace=${payload.trace};host=${payload.host};script=${payload.script}`
    if ("key" in payload.payload && payload.payload.value !== undefined) {
      const metricName = `bitburner.${settings.gameHost}.${payload.payload.key}`;
      const request = graphiteRequest;
      request.body = `${metricName} ${payload.payload.value} ${Math.floor(payload.timestamp / 1e9)}\n`;

      const response = await fetch(graphiteUrl, request);
      if (!response.ok) {
        ns.tprint(
          `ERROR: Failed to send metric to graphite. HTTP code: ${response.status}`,
        );
        return false;
      } else {
        // ns.print("Send Successful.");
      }
    }
    return true;
  }
  return false;
};

const sendLog = async function (
  ns: NS,
  settings: LoggingSettings,
  payload: LoggingPayload,
): Promise<boolean> {
  if ("message" in payload.payload) {
    const values = [
      [
        `${payload.timestamp}`,
        (payload.payload as LogData).message,
      ],
    ];
    const request = lokiRequest;
    const body = {
      streams: [
        {
          stream: {
            host: payload.host,
            args: payload.args,
            script: payload.script,
            game: settings.gameHost,
          },
          values: values,
        },
      ],
    };
    request.body = JSON.stringify(body);

    const response = await fetch(lokiUrl, request);
    if (!response.ok) {
      ns.tprint(
        `ERROR: Failed to send logging to loki. HTTP code: ${response.status}`,
      );
    } else {
      // ns.print("Send Successful.")
    }
    return response.ok;
  }
  return false;
};

let lokiUrl: string;
let lokiRequest: RequestInit;
const setupLoki = function (settings: LoggingSettings) {
  lokiUrl = `${settings.loggingHost}/loki/api/v1/push`;
  lokiRequest = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  };
};

const loggingSettingsFile = "loggingSettings.txt";

const checkLoggingSettings = async function (ns: NS): Promise<LoggingSettings> {
  const settings = LoggingSettings.fromJSON(
    ns.read(loggingSettingsFile) as string,
  );
  let saveSettings = false;
  if (!settings.gameHost) {
    saveSettings = true;
    const host = await ns.prompt("Enter Game Identifier", { type: "text" });
    if (typeof host === "string") settings.gameHost = host;
  }

  if (!settings.loggingHost) {
    saveSettings = true;
    const host = await ns.prompt(
      "Enter Logging server host address (http://loki.example.org:3100)",
      { type: "text" },
    );
    if (typeof host === "string") settings.loggingHost = host;
  }

  if (!settings.metricHost) {
    saveSettings = true;
    const host = await ns.prompt(
      "Enter metric server host address (http://graphite.example.org:2003)",
      { type: "text" },
    );
    if (typeof host === "string") settings.metricHost = host;
  }

  if (saveSettings) {
    await ns.write(loggingSettingsFile, JSON.stringify(settings), "w");
  }
  return settings;
};

async function trimRecords(ns: NS, loggingDB: IDBPDatabase): Promise<void> {
  ns.print(`Tidying up records`);
  const deleteTime = (Date.now() - 6 * 60 * 60 * 1000) * 1e6; //drop older than 6hrs converted to nanosec

  const loggingTX = loggingDB.transaction("logging", "readwrite");
  const loggingIndex = loggingTX.index("timestamp");
  const loggingRecords = await loggingIndex.count(
    IDBKeyRange.upperBound(deleteTime, false),
  );
  ns.print(`Deleting ${loggingRecords} from logging table`);
  if (loggingRecords > 0) {
    const cursor = loggingTX.openCursorRaw( IDBKeyRange.upperBound(deleteTime, false))
    let cursorDone = false;
    cursor.onsuccess = function () {
      if (cursor.result) {
        cursor.result.delete()
        cursor.result.continue();
      }
      else{
        cursorDone = true;
      }
    }
    do{
      await ns.asleep(50);
    } while(!cursorDone)
  }
  
  const metricTX = loggingDB.transaction("metrics", "readwrite");
  const metricIndex = metricTX.index("timestamp");
  const metricRecords = await metricIndex.count(
    IDBKeyRange.upperBound(deleteTime, false),
  );
  ns.print(`Deleting ${metricRecords} from metrics table`);
  if (metricRecords > 0) {
    const cursor = metricTX.openCursorRaw( IDBKeyRange.upperBound(deleteTime, false))
    let cursorDone = false;
    cursor.onsuccess = function () {
      if (cursor.result) {
        cursor.result.delete()
        cursor.result.continue();
      }
      else{
        cursorDone = true;
      }
    }
    do{
      await ns.asleep(50);
    } while(!cursorDone)
  }
}
export async function main(ns: NS): Promise<void> {
  const loggingSettings = await checkLoggingSettings(ns);
  setupLoki(loggingSettings);
  setupGraphite(loggingSettings);

  const logging = new Logging(ns);
  await logging.initLogging();

  const loggingDB = logging.loggingDB;
  if (loggingDB) {
    await trimRecords(ns, loggingDB);
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        let start = Date.now();
        await sendLogs(loggingDB, ns, loggingSettings, LoggingTable, sendLog);
        ns.print(`time taken: ${ns.tFormat(Date.now() - start)}`);
        start = Date.now();
        await sendLogs(loggingDB, ns, loggingSettings, MetricTable, sendTrace);
        ns.print(`time taken: ${ns.tFormat(Date.now() - start)}`);
      } catch (e) {
        ns.print(`failed to send log: ${e}`);
      }
      await ns.asleep(1000);
    }
  }
}

async function sendLogs(
  loggingDB: IDBPDatabase,
  ns: NS,
  loggingSettings: LoggingSettings,
  table: "logging" | "metrics",
  sender: (
    ns: NS,
    settings: LoggingSettings,
    payload: LoggingPayload,
  ) => Promise<boolean>,
): Promise<void> {
  const lineCount = await loggingDB.transaction(table, "readonly").count();
  ns.print(`${lineCount} ${table} transactions queued.`);
  await sendTrace(
    ns,
    loggingSettings,
    new LoggingPayload(
      ns.getHostname(),
      ns.getScriptName(),
      "641f4573-9d96-4c77-a703-cd6324cce93c",
      {
        key: `logging.${table}.count`,
        value: lineCount,
      },
    ),
  );
  if (lineCount === 0) {
    return new Promise<void>((res) => {
      res();
    });
  }

  //read entries to send
  const readTransaction = await loggingDB.transaction(table);
  const readCursorProm = readTransaction.openCursorRaw();
  let batchSize = 3000;
  const recordBatch = new Map<IDBValidKey, unknown>();

  readCursorProm.onsuccess = function () {
    const cursor = this.result;
    if (cursor && batchSize > 0) {
      batchSize--;
      recordBatch.set(cursor.primaryKey, cursor.value);
      cursor.continue();
    }
  };

  await new Promise<void>((res) => {
    readTransaction.tx.oncomplete = function () {
      res();
    };
  });

  ns.print(`Collected ${recordBatch.size} entries`);
  //attempt to send entries
  const sendingLogs = new Map<IDBValidKey, Promise<boolean>>();
  recordBatch.forEach((val, key) => {
    sendingLogs.set(key, sender(ns, loggingSettings, val as LoggingPayload));
  });

  //wait for the entries to finish sending
  const sentKeys = new Set<IDBValidKey>();
  for (const [key, promise] of sendingLogs) {
    const success = await promise;
    if (success) sentKeys.add(key);
  }
  ns.print(`Sent ${sentKeys.size} entries`);

  const deleteTransaction = await loggingDB.transaction(table, "readwrite");
  for (const key of sentKeys) {
    deleteTransaction.delete(key);
  }
  deleteTransaction.commit();
}
