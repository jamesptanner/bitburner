import { NS } from '@ns';
import { weakenServer } from '/shared/HGW';
import { asNumber, asString } from '/shared/utils';
import { initLogging, logging } from "/shared/logging";

export const weakenPath ="/batching/weaken.js";

export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    const target = asString(ns.args[0])
    const startTime = asNumber(ns.args[1])
    if (typeof target === 'string' && typeof startTime === 'number' ) {
        await ns.sleep(Math.max(0,startTime-Date.now()))
        logging.info(`😷: ${target}. ${(ns.getWeakenTime(target) / 1000).toFixed(2)}s`)
        await weakenServer(ns, target);
    }
}