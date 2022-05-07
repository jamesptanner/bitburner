import { NS } from '@ns';
import { asNumber, asString } from '/shared/utils';
import { initLogging,logging } from '/shared/logging';

export const triggerJobPath ="/cron/triggerJob.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    const args = ns.args
    let tmp = args.shift()
    if(!tmp){
         logging.error(`no interval provided`)
         return
    }
    const interval = asNumber(tmp)
    tmp =args.shift()
    if(!tmp){
         logging.error(`no script provided`)
         return
    }
    const script = asString(tmp)
    await ns.asleep(Math.random()*interval)
    ns.tprintf(`INFO: setting up cronjob: ${script}`)
    while(interval && script){
        const pid = ns.run(script,1,...args)
        if(pid ===0){
            logging.info(`failed to start script.`)
        }
        await ns.asleep(interval)
        logging.info(`cronjob triggered.`)
    }
}