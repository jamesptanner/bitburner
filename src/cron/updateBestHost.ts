import { NS } from '@ns';
import { findBestTarget } from '/shared/utils';
import { killscriptPath } from '/utils/killscript';
import { initLogging, logging} from '/shared/logging';

export const updateBestHostPath ="/cron/updateBestHost.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    const currentBest = ns.read("target.txt")
    const target = findBestTarget(ns)  
    if(currentBest != target){
        logging.info(`Updating target old:${currentBest} new:${target}`)
        await ns.write("target.txt",target,"w")
        ns.exec(killscriptPath,"home",1,"hack")
        ns.exec("net/walker.js","home")
    }
}