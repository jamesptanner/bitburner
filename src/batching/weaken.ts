import { NS } from '@ns'
import { weakenServer } from '/shared/HGW';
import { asString, asNumber } from '/shared/utils';

export const weakenPath ="/batching/weaken.js";

export async function main(ns: NS): Promise<void> {
    const target = asString(ns.args[0])
    const startTime = asNumber(ns.args[1])
    if (typeof target === 'string' && typeof startTime === 'number' ) {
        await ns.sleep(startTime-Date.now())
        ns.print(`INFO 😷: ${target}. ${(ns.getWeakenTime(target) / 1000).toFixed(2)}s`)
        await weakenServer(ns, target);
    }
}