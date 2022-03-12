import { NS } from '@ns'
import { asString,asNumber } from '/shared/utils';

export const triggerJobPath ="/cron/triggerJob.js";

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
    await ns.asleep(Math.random()*interval)
    ns.tprintf(`INFO: setting up cronjob: ${script}`)
    while(interval && script){
        ns.run(script,1,...args)
        await ns.asleep(interval)
        ns.print(`INFO cronjob triggered.`)
    }
}