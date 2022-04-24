import { NS } from '@ns';
import { growServer } from '/shared/HGW';
import { asNumber, asString } from '/shared/utils';

export const growPath = "/batching/grow.js";

export async function main(ns: NS): Promise<void> {
    const target = asString(ns.args[0])
    const startTime = asNumber(ns.args[1])
    if (typeof target === 'string' && typeof startTime === 'number' ) {
        await ns.sleep(Math.max(0,startTime-Date.now()))
        ns.print(`INFO 🎈: ${target}. ${(ns.getGrowTime(target) / 1000).toFixed(2)}s`)
        await growServer(ns, target);
    }
}