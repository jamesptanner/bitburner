import { NS } from '@ns';
import { solveContractPath } from '/contracts/solveContract';
import { Logging } from '/shared/logging';


export const processContractsPath ="/contracts/processContracts.js";

interface Contract {
    name: string
    host: string
}

export async function main(ns : NS) : Promise<void> {
    
    const logging = new Logging(ns);
    
    const contractMap = JSON.parse(ns.read("contracts.txt") as string)
    let contractsByType = new Array<Contract>()
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
    let incompletedContracts = new Array<Contract>();
    while (contractsByType.length > 0){
        contractsByType.forEach( contract => {
            logging.info(`Running contract ${contract.name}`);
            if (ns.exec(solveContractPath,"home",1,contract.name,contract.host) === 0) {
                incompletedContracts.push(contract);
            }
        });
        if (incompletedContracts.length > 0){
            contractsByType = incompletedContracts;
        } 
        incompletedContracts = new Array<Contract>();
        await ns.asleep(10000);
    }
}