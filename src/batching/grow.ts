import { NS } from '@ns'
import { growServer } from '/shared/HGW';

export const growPath = "/batching/grow.js";

export async function main(ns: NS): Promise<void> {
    const [target,waitTime] = ns.args;
    if (typeof target === 'string' && typeof waitTime === 'number' ) {
        await ns.sleep(waitTime)
        ns.print(`INFO 🎈: ${target}. ${(ns.getGrowTime(target) / 1000).toFixed(2)}s`)
        await growServer(ns, target);
    }
}