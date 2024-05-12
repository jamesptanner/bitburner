import { NS } from "@ns";

export const clearFailedContractsPath = "/contracts/clearFailedContracts.js";

export async function main(ns: NS): Promise<void> {
  const failedContracts = ns.ls("home", "failedContracts");
  for (const contractFile in failedContracts) {
    ns.rm(failedContracts[contractFile]);
  }
}
