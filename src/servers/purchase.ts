import { NS } from "@ns";
import { getHostsPath } from "/startup/getHosts";
import { Logging } from "/shared/logging";

export const purchasePath = "/servers/purchase.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();
  const [name, level] = ns.args;
  if (typeof name === "string" && typeof level === "number") {
    const size = 2 << level;
    const newHost = ns.purchaseServer(name, size);
    if (newHost === "") {
      logging.error("Failed to purchase server", true);
    } else {
      logging.success(`purchased server ${newHost} size: ${size}GB`, true);
      ns.spawn(getHostsPath);
    }
  } else {
    logging.info(`Usage: ${purchasePath} name size`);
  }
}
