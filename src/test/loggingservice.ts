import { NS } from '@ns'
import { log,Level,initLogging,sendMetric } from '/shared/logging';

export const loggingservicePath ="/test/loggingservice.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    await log(Level.Error,`This is a message at ${Date.now().toLocaleString()}`)
    sendMetric("key.level.depth",11)
    sendMetric("key.level.time",Date.now())
    for (let index = 0; index < 100; index++) {
        sendMetric("key.level.value",Math.random()%100)
        await ns.sleep(1000)        
    }

}