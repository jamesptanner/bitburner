import { NS } from "@ns";
import { growServer, weakenServer, attack } from "/utils/HGW";

export const hackHostPath ="/hosts/hackHost.js";

export async function main(ns: NS): Promise<void> {
    const target = ns.args[0];
    ns.tprintf(`INFO hacking target: ${target}`);
    if (typeof target === 'string') {
        const max = ns.getServerMaxMoney(target)
        while (max != 0) {
                
            const current = ns.getServerMoneyAvailable(target)
            const percent = current/max;
            // ns.tprintf(`${target} money, curr:${current} max:${max} ${percent}%%`)
            if (!(ns.getServerSecurityLevel(target) < ns.getServerMinSecurityLevel(target)+1)) {
                ns.print(`INFO 😷: ${target}. ${(ns.getWeakenTime(target)/1000).toFixed(2)}s`)
                await weakenServer(ns, target);
            }
            else if ((percent < 0.8 && ns.growthAnalyze(target,2) <=5) || percent < 0.10) {
                ns.print(`INFO 🎈: ${target}. ${(ns.getGrowTime(target)/1000).toFixed(2)}s`)
                await growServer(ns, target);
            }
            else {
                ns.print(`INFO 🤖: ${target}. ${(ns.getHackTime(target)/1000).toFixed(2)}s`)
                await attack(ns, target); 
            }
        }
        ns.tprintf(`WARN: ${target} doesn't have any cash.`)
    }
}