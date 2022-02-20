import { NS } from '@ns'
import { triggerJobPath } from '/triggerJob';

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
        interval:1000*60*5
    }
]

export async function main(ns : NS) : Promise<void> {
    ns.ps().filter(proc =>{ return proc.filename.indexOf("triggerJob.js")!=-1 }).forEach(proc => ns.kill(proc.pid))
    jobs.forEach(job => {
        ns.run("triggerJob.js",1,[job.interval, job.script, ...job.args])
    });
}