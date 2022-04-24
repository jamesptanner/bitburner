import { NS } from '@ns';
import { scripts } from '/shared/HGW';
import { getHostsPath } from '/startup/getHosts';

export const buyScriptsPath ="/cron/buyScripts.js";

export async function main(ns : NS) : Promise<void> {
    const player = ns.getPlayer()
    if(!player.tor){
        if(!ns.singularity.purchaseTor()){
            ns.printf(`not enough money to buy tor router`)
            ns.exit()
        }
        ns.run(getHostsPath)
    }
    for (const scriptInfo of scripts) {
        const script = scriptInfo[0];
        if (!ns.fileExists(script)) {
           if(!ns.singularity.purchaseProgram(script)){
               ns.printf(`not enough money to buy ${script}`)
           }
        }
    }
}