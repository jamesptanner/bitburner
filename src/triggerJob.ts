import { NS } from '@ns'

export const triggerJobPath ="/triggerJob.js";

export async function main(ns : NS) : Promise<void> {
    const args = ns.args
    const interval = args.shift()
    const script = args.shift()
    ns.tprintf(`INFO: setting up cronjob: ${script}`)
    while(true){
        ns.run(script,1,...args)
        await ns.asleep(interval)
        ns.tprintf(`INFO cronjob triggered.`)
    }
}