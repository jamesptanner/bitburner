import { NS } from '@ns'
import { weakenServer } from '/shared/HGW';

export const weakenPath ="/batching/weaken.js";

export async function main(ns: NS): Promise<void> {
    const [target,waitTime] = ns.args;
    if (typeof target === 'string' && typeof waitTime === 'number' ) {
        await ns.sleep(waitTime)
        ns.print(`INFO 😷: ${target}. ${(ns.getWeakenTime(target) / 1000).toFixed(2)}s`)
        await weakenServer(ns, target);
    }
}