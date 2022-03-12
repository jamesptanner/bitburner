import { NS } from '@ns'
import { triggerJobPath } from '/cron/triggerJob';

interface Job {
    script: string
    args: string[]
    interval:number
}
export const cronPath ="/autorun/cron.js";

const jobs: Job[] = [
    {
        script:"/net/walker.js",
        args:[],
        interval:1000*60
    },
    {
        script:"contracts/findContracts.js",
        args:[],
        interval:1000*60
    },
    {
        script:"createScripts.js",
        args:[],
        interval:10*1000*60
    },
    {
        script:"cron/updateBestHost.js",
        args:[],
        interval:5*60*1000
    },
    {
        script:"cron/processBackdoors.js",
        args:[],
        interval:5*60*1000
    }
]

export async function main(ns : NS) : Promise<void> {
    ns.ps().filter(proc =>{ return proc.filename.indexOf(triggerJobPath)!=-1 }).forEach(proc => ns.kill(proc.pid))
    jobs.forEach(job => {
        ns.run(triggerJobPath,1,job.interval, job.script, ...job.args) 
    });
}