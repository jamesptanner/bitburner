import { NS } from "@ns";
import { growServer, weakenServer } from "/shared/HGW";

export const prepareHostPath ="/batching/prepareHost.js";

export async function main(ns: NS): Promise<void> {
    const target = ns.args[0];
    ns.tprintf(`INFO preparing target: ${target}`);
    if (typeof target === 'string') {
        while (true) {
            if ((ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target))) {
                ns.print(`INFO 😷: ${target}. ${(ns.getWeakenTime(target) / 1000).toFixed(2)}s`)
                await weakenServer(ns, target);
            }
            else if (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) ) {
                ns.print(`INFO 🎈: ${target}. ${(ns.getGrowTime(target) / 1000).toFixed(2)}s`)
                await growServer(ns, target);
            }
            else {
                break;
            }
        }
    }
}
