import { NS } from '@ns';
import { growServer } from '/shared/HGW';
import { initLogging, logging } from '/shared/logging';
import { asNumber, asString } from '/shared/utils';

export const growPath = "/batching/grow.js";

export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    const target = asString(ns.args[0])
    const startTime = asNumber(ns.args[1])
    if (typeof target === 'string' && typeof startTime === 'number' ) {
        logging.info(`🎈: ${target}. ${(ns.getGrowTime(target) / 1000).toFixed(2)}s`)
        await ns.asleep(Math.max(0,startTime-Date.now()))
        await growServer(ns, target);
    }
}