import { NS } from '@ns'
import { hackServer } from '/shared/HGW';

export const hackPath ="/batching/hack.js";

export async function main(ns: NS): Promise<void> {
    const [target,waitTime] = ns.args;
    if (typeof target === 'string' && typeof waitTime === 'number' ) {
        await ns.sleep(waitTime)
        ns.print(`INFO 🤖: ${target}. ${(ns.getHackTime(target) / 1000).toFixed(2)}s`)
        await hackServer(ns, target);
    }
}