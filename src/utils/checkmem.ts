import { NS } from "@ns";
import { Level, Logging } from "/shared/logging";

export const checkmemPath = "/utils/checkmem.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();
  ns.disableLog("ALL");
  ns.tail();
  ns.clearLog();
  ns.ls("home", ".js").forEach((script) => {
    const totalMem = ns.getServerMaxRam("home");
    const mem = ns.getScriptRam(script);
    const memPercent = mem / totalMem;
    let level: Level = Level.Error;
    if (memPercent > 0) {
      if (memPercent < 0.5) level = Level.Info;
      else if (memPercent < 1) level = Level.Warning;
    }
    logging.log(level,`${script}: ${mem}GB`);
  });
}
