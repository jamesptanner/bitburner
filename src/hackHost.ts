import { NS } from "@ns";
import { growServer, weakenServer, attack } from "./utils";

export async function main(ns: NS): Promise<void> {
    const target = ns.args[0];

    if (typeof target === 'string') {
        const max = ns.getServerMaxMoney(target)
        while (true) {
            const current = ns.getServerMoneyAvailable(target)
            if ((current / max) < 0.6) {
                await growServer(ns, target);
            }
            else if (ns.getServerSecurityLevel(target) > 20) {
                await weakenServer(ns, target);
            }
            else {
                await attack(ns, target); 
            }
        }
    }
}