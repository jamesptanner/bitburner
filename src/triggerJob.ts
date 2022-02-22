import { NS } from '@ns'
import { asString } from '/utils/utils';
import { asNumber } from './utils/utils';

export const triggerJobPath ="/triggerJob.js";

export async function main(ns : NS) : Promise<void> {
    const args = ns.args
    let tmp = args.shift()
    if(!tmp){
         ns.tprintf(`ERROR no interval provided`)
         return
    }
    const interval = asNumber(tmp)
    tmp =args.shift()
    if(!tmp){
         ns.tprintf(`ERROR no script provided`)
         return
    }
    const script = asString(tmp)
    await ns.asleep(Math.random()*1000*60)
    ns.tprintf(`INFO: setting up cronjob: ${script}`)
    while(interval && script){
        ns.run(script,1,...args)
        await ns.asleep(interval)
        ns.print(`INFO cronjob triggered.`)
    }
}