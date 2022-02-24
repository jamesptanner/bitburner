import { NS } from '@ns'
import {findBestTarget} from '/utils/utils'

export const updateBestHostPath ="/cron/updateBestHost.js";

export async function main(ns : NS) : Promise<void> {
    const target = findBestTarget(ns)  
    await ns.write("target.txt",target,"w")
}