import { NS } from '@ns';
import { initLogging } from '/shared/logging';

export const clearFailedContractsPath ="/contracts/clearFailedContracts.js";

export async function main(ns : NS) : Promise<void> {
  await initLogging(ns)
  const failedContracts = ns.ls("home","failedContracts");
  for(const contractFile in failedContracts){
    ns.rm(failedContracts[contractFile]);
  }
}