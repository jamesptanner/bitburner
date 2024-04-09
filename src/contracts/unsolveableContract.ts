import { NS } from "@ns";
import { Logging } from "/shared/logging";

export const unsolveableContractPath = "/contracts/unsolveableContract.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();

  const args = ns.flags([
    ["file", ""],
    ["host", ""],
  ]);
  if (args.host === "" || args.file === "") {
    logging.warning("Not enough info to find contract", true);
    ns.exit();
  }
  const filename = args.file as string;
  const host = args.host as string;

  if (!ns.fileExists(filename, host)) {
    logging.warning("contract missing.");
    ns.exit();
  }

  const contractDesc = ns.codingcontract.getDescription(filename, host);
  const contractData = ns.codingcontract.getData(filename, host);
  const contractType = ns.codingcontract.getContractType(filename, host);
  if (!ns.rm(filename, host)) {
    logging.info(`unable to delete ${host}:${filename}`);
  }

  await ns.write(
    `/failedContracts/${filename.replace("cct", "txt").replace("'", "_").replace("&", "_")}`,
    [contractType, contractData, contractDesc].join("\n\n"),
    "w",
  );
}
