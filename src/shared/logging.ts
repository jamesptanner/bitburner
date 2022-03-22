import { notStrictEqual } from "assert";
import { randomUUID } from "crypto";
import { NS, NetscriptPort } from "@ns";

enum Level {
  Error,
  Warning,
  Info,
  success,
}

const LOGGING_PORT = 1;
const loggingTrace = "";
const initializedLogging = false;
let n: NS = null;
let portHandle: NetscriptPort = null;

export const initLogging = function (ns: NS): void {
  n = ns;
  portHandle = ns.getPortHandle(LOGGING_PORT);
  loggingTrace = randomUUID();
  initializedLogging = true;
};

export const sendMetric = function () {
  if (!initializedLogging) {
  }
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
  portHandle.tryWrite(logS);
};
