import { NS } from '@ns'
import { walk } from '/utils/utils'
import { processContractsPath } from '/contracts/processContracts';

export async function main(ns : NS) : Promise<void> {
    const contracts = {};
    await walk(ns, "home",async (ns,host,contracts): Promise<boolean> => {
        if (typeof host === 'string') {
            contracts[host] = ns.ls(host, ".cct")
        }
    return true;
    },contracts);
    await ns.write("contracts.txt",JSON.stringify(contracts),"w");
    ns.spawn(processContractsPath)
}