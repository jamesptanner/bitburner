import { NS } from '@ns';
import { scripts } from '/shared/HGW';
import { getHostsPath } from '/startup/getHosts';
import { initLogging,logging } from '/shared/logging';

export const buyScriptsPath ="/cron/buyScripts.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    const player = ns.getPlayer()
    if(!player.tor){
        if(!ns.singularity.purchaseTor()){
            logging.warning(`not enough money to buy tor router`)
            ns.exit()
        }
        ns.run(getHostsPath)
    }
    for (const scriptInfo of scripts) {
        const script = scriptInfo[0];
        if (!ns.fileExists(script)) {
           if(!ns.singularity.purchaseProgram(script)){
               logging.warning(`not enough money to buy ${script}`)
           }
           else{
               logging.success(`bought ${script}`)
           }
        }
    }
}