import { NS } from "@ns";
import { routeToHost } from "/shared/utils";
import { Logging } from "/shared/logging";

export const routeToPath = "/utils/routeTo.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();
  ns.disableLog("ALL");
  ns.tail();
  const opts = ns.flags([["host", "home"]]);
  const hops = routeToHost(
    ns,
    ns.singularity.getCurrentServer(),
    opts.host as string,
  );
  if (hops && hops.length > 0) {
    logging.info(`routing via ${hops}`);
    hops.forEach((hop) => ns.singularity.connect(hop));
  }
}
