import { NS } from "@ns";
import { growServer, weakenServer } from "/utils/HGW";

export const prepareHostPath = "/hacking/prepareHost.js";

export async function main(ns: NS): Promise<void> {
    const target = ns.args[0];
    ns.tprintf(`INFO preparing target: ${target}`);
    if (typeof target === 'string') {
        while (true) {
            const current = ns.getServerMoneyAvailable(target)
            const max = ns.getServerMaxMoney(target)
            const percent = current / max;
            if (!(ns.getServerSecurityLevel(target) < ns.getServerMinSecurityLevel(target))) {
                ns.print(`INFO 😷: ${target}. ${(ns.getWeakenTime(target) / 1000).toFixed(2)}s`)
                await weakenServer(ns, target);
            }
            else if (percent < 1) {
                ns.print(`INFO 🎈: ${target}. ${(ns.getGrowTime(target) / 1000).toFixed(2)}s`)
                await growServer(ns, target);
            }
            else {
                break;
            }
        }
    }
}
