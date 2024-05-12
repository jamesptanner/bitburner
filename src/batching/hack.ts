import { NS } from "@ns";
import { hackServer } from "/shared/HGW";
import { asNumber, asString } from "/shared/utils";
import { Logging } from "/shared/logging";

export const hackPath = "/batching/hack.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();

  const target = asString(ns.args[0]);
  const startTime = asNumber(ns.args[1]);
  if (typeof target === "string" && typeof startTime === "number") {
    logging.info(
      `🤖: ${target}. ${(ns.getHackTime(target) / 1000).toFixed(2)}s`,
    );
    await ns.asleep(Math.max(0, startTime - Date.now()));
    await hackServer(ns, target);
  }
}
