import { NS } from "@ns";
import { Logging } from "/shared/logging";

export const checkCostsPath = "/servers/checkCosts.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();
  ns.tail();
  ns.clearLog();

  let mem = 2;
  while (mem <= ns.getPurchasedServerMaxRam()) {
    logging.info(
      `${Math.log2(mem)} : ${mem}GB = $${ns.formatNumber(Math.round(ns.getPurchasedServerCost(mem)), 2)}`,
    );
    mem <<= 1;
  }
}
