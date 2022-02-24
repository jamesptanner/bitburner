import { NS } from '@ns'
import { killscriptPath } from '/killscript';
import {findBestTarget} from '/utils/utils'

export const updateBestHostPath ="/cron/updateBestHost.js";

export async function main(ns : NS) : Promise<void> {
    const currentBest = ns.read("target.txt")
    const target = findBestTarget(ns)  
    if(currentBest != target){
        await ns.write("target.txt",target,"w")
        ns.exec(killscriptPath,"home",1,"hack")
    }
}