import { NS } from "@ns";
import { OpenIDB, IDBPDatabase } from "lib/idb";

export enum Level {
  Error,
  Warning,
  Info,
  success,
}

export type LogData = {
  level: Level;
  message: string;
};

export type MetricData = {
  key: string;
  value: number | string;
};

export class LoggingPayload {
  host: string;
  script: string;
  args: string;
  trace: string;
  timestamp: number;
  payload: MetricData | LogData;
  constructor(
    host?: string,
    script?: string,
    trace?: string,
    payload?: MetricData | LogData,
    args?: string,
  ) {
    this.host = host ? host : "UNKNOWN";
    this.script = script ? script : "UNKNOWN";
    this.trace = trace ? trace : "UNKNOWN";
    this.payload = payload
      ? payload
      : { level: Level.Error, message: "UNKNOWN" };
    this.args = args ? args : "";

    this.timestamp = Date.now() * 1000000;
  }

  static fromJSON(d: string): LoggingPayload {
    return Object.assign(new LoggingPayload(), JSON.parse(d));
  }
}

//from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid.
//cant import crypto so this should do.
//TODO import { initLogging } from '/shared/logging';
// keep an eye out for something better.
function generateUUID() {
  // Public Domain/MIT
  let d = new Date().getTime(); //Timestamp
  let d2 =
    (typeof performance !== "undefined" &&
      performance.now &&
      performance.now() * 1000) ||
    0; //Time in microseconds since page-load or 0 if unsupported
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    let r = Math.random() * 16; //random number between 0 and 16
    if (d > 0) {
      //Use timestamp until depleted
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      //Use microseconds since page-load if supported
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const LoggingTable = "logging";
export const MetricTable = "metrics";
const DBVERSION = 1;

export class Logging {
  [x: string]: any;

  private loggingTrace = generateUUID();
  private n: NS;

  loggingDB: IDBPDatabase | undefined;

  constructor(ns: NS) {
    this.n = ns;
    ns.disableLog("ALL");
    return this;
  }

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
  }

  private levelToToast(
    level: Level,
  ): "success" | "warning" | "error" | "info" | undefined {
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
  }

  public log(level: Level, msg: string, toast?: boolean): void {
    if (toast) {
      this.n.toast(
        `${this.levelToString(level)}: ${msg}`,
        this.levelToToast(level),
      );
    }
    this.n.print(`${this.levelToString(level)}: ${msg}`);
    if (this.loggingDB) {
      const logPayload = new LoggingPayload(
        this.n.getHostname(),
        this.n.getScriptName(),
        this.loggingTrace,
        {
          level: level,
          message: msg,
        },
        this.n.args.toString(),
      );
      const tx = this.loggingDB.transaction(LoggingTable, "readwrite");
      tx.putAndForget(logPayload);
      tx.commit();
    }
  }

  public async initLogging() {
    this.n.clearLog();
    this.loggingDB = await OpenIDB("BBLogging", DBVERSION, {
      upgrade(db, prevVersion) {
        if (prevVersion < 1) {
          const loggingStore = db.createObjectStore(LoggingTable, {
            autoIncrement: true,
          });
          loggingStore.createIndex("timestamp", "timestamp", { unique: false });
          const metricStore = db.createObjectStore(MetricTable, {
            autoIncrement: true,
          });
          metricStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      },
    });
  }

  public success(msg: string, toast?: boolean): void {
    this.log(Level.success, msg, toast);
  }
  public info(msg: string, toast?: boolean): void {
    this.log(Level.Info, msg, toast);
  }
  public warning(msg: string, toast?: boolean): void {
    this.log(Level.Warning, msg, toast);
  }
  public error(msg: string, toast?: boolean): void {
    this.log(Level.Error, msg, toast);
  }

  public sendMetric(key: string, value: number): void {
    if (!isNaN(value)) {
      this.info(`Metric ${key}: ${value}`);
      if (this.loggingDB !== undefined) {
        const logPayload = new LoggingPayload(
          this.n.getHostname(),
          this.n.getScriptName(),
          this.loggingTrace,
          {
            key: key,
            value: value,
          },
          this.n.args.toString(),
        );

        const tx = this.loggingDB.transaction(MetricTable, "readwrite");
        tx.putAndForget(logPayload);
        tx.commit();
      }
    }
  }
}

export const TextColors = {
  black: "\u001b[30m",
  red: "\u001b[31m",
  green: "\u001b[32m",
  yellow: "\u001b[33m",
  blue: "\u001b[34m",
  magenta: "\u001b[35m",
  cyan: "\u001b[36m",
  white: "\u001b[37m",
  brightBlack: "\u001b[30;1m",
  brightRed: "\u001b[31;1m",
  brightGreen: "\u001b[32;1m",
  brightYellow: "\u001b[33;1m",
  brightBlue: "\u001b[34;1m",
  brightMagenta: "\u001b[35;1m",
  brightCyan: "\u001b[36;1m",
  brightWhite: "\u001b[37;1m",
  reset: "\u001b[0m"
}

export function ansiRegex({onlyFirst = false} = {}): RegExp {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
	].join('|');

	return new RegExp(pattern, onlyFirst ? undefined : 'g');
}