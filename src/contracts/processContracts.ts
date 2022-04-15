import { NS } from '@ns'
import { solveContractPath } from '/contracts/solveContract';

export const processContractsPath ="/contracts/processContracts.js";

interface Contract {
    name: string
    host: string
}

export async function main(ns : NS) : Promise<void> {
    const contractMap = JSON.parse(ns.read("contracts.txt"))
    const contractsByType = new Array<Contract>()
    for (const host in contractMap) {
        if (Object.prototype.hasOwnProperty.call(contractMap, host)) {
            const contracts = contractMap[host];
            for (let index = 0; index < contracts.length; index++) {
                const contract: Contract = {
                    name: `${contracts[index]}`,
                    host: host,
                }
                contractsByType.push(contract)
            }
        }
    }
    await ns.write("processedContracts.txt",JSON.stringify(contractsByType),"w")
    contractsByType.forEach( contract => {
        ns.exec(solveContractPath,"home",1,contract.name,contract.host)
    });

}