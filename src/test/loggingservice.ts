import { NS } from '@ns';
import { Logging } from '/shared/logging';

export const loggingservicePath ="/test/loggingservice.js";

export async function main(ns : NS) : Promise<void> {
    const logging = new Logging(ns);
    logging.error(`This is a message at ${Date.now().toLocaleString()}`)
    logging.sendMetric("key.level.depth",11)
    logging.sendMetric("key.level.time",Date.now())
    for (let index = 0; index < 100; index++) {
        logging.sendMetric("key.level.value",Math.random()%100)
        await ns.asleep(1000)        
    }

}