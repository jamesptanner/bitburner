import { NS } from '@ns'
import { killscriptPath } from '/utils/killscript';
import {findBestTarget} from '/shared/utils'

export const updateBestHostPath ="/cron/updateBestHost.js";

export async function main(ns : NS) : Promise<void> {
    const currentBest = ns.read("target.txt")
    const target = findBestTarget(ns)  
    if(currentBest != target){
        ns.tprintf(`Updating target old:${currentBest} new:${target}`)
        await ns.write("target.txt",target,"w")
        ns.exec(killscriptPath,"home",1,"hack")
        ns.exec("net/walker.js","home")
    }
}