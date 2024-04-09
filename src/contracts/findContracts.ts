import { NS } from "@ns";
import { processContractsPath } from "/contracts/processContracts";
import { getAllServers } from "/shared/utils";
import { Logging } from "/shared/logging";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();

  const contracts: Map<string, string[]> = new Map<string, string[]>();
  logging.info(`searching for contracts.`);
  getAllServers(ns).forEach((host) => {
    if (typeof host === "string") {
      contracts.set(host, ns.ls(host, ".cct"));
    }
  });
  await ns.write(
    "contracts.txt",
    JSON.stringify(Object.fromEntries<string[]>(contracts)),
    "w",
  );
  ns.spawn(processContractsPath);
}
