import { NS } from "@ns";
import { growServer, weakenServer, attack } from "./HGW";

export async function main(ns: NS): Promise<void> {
    const target = ns.args[0];
    ns.tprintf(`INFO hacking target: ${target}`);
    if (typeof target === 'string') {
        
        const max = ns.getServerMaxMoney(target)
        while (true) {
            const current = ns.getServerMoneyAvailable(target)
            
            if ((current / max) < 0.6 && ns.growthAnalyze(target,2) <=5) {
                ns.tprintf(`INFO 🎈: ${target}`)

                await growServer(ns, target);
            }
            else if (ns.getServerSecurityLevel(target) > 20) {
                ns.tprintf(`INFO 😷: ${target}`)
                await weakenServer(ns, target);
            }
            else {
                ns.tprintf(`INFO 🐱‍💻: ${target}`)
                await attack(ns, target); 
            }
        }
    }
}