import { NS } from "@ns";

export const clearContractsPath = "/contracts/clearContracts.js";

interface Contract {
  name: string;
  host: string;
}

export async function main(ns: NS): Promise<void> {
  const contractMap = JSON.parse(ns.read("contracts.txt") as string);
  const contractsByType = new Array<Contract>();
  for (const host in contractMap) {
    if (Object.prototype.hasOwnProperty.call(contractMap, host)) {
      const contracts = contractMap[host];
      for (let index = 0; index < contracts.length; index++) {
        const contract: Contract = {
          name: `${contracts[index]}`,
          host: host,
        };
        contractsByType.push(contract);
        ns.rm(contracts[index], host);
      }
    }
  }
}
