import { NS } from '@ns'
import { walk } from './utils'

export async function main(ns : NS) : Promise<void> {
    const contracts = {};
    await walk(ns, "home",async (ns,host,contracts): Promise<boolean> => {
        if (typeof host === 'string') {
            contracts[host] = ns.ls(host, ".cct")
        }
    return true;
    },contracts);
    ns.tprintf(`${JSON.stringify(contracts)}`);
    await ns.write("contracts.txt",JSON.stringify(contracts),"w");
}