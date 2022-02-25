import { NS } from "@ns";
import { growServer, weakenServer, attack } from "/utils/HGW";

export async function main(ns: NS): Promise<void> {
    const target = ns.args[0];
    ns.tprintf(`INFO hacking target: ${target}`);
    if (typeof target === 'string') {

        const current = ns.getServerMoneyAvailable(target)
        const max = ns.getServerMaxMoney(target)
        const percent = current / max;
        // ns.tprintf(`${target} money, curr:${current} max:${max} ${percent}%%`)
        if (!(ns.getServerSecurityLevel(target) < ns.getServerMinSecurityLevel(target) + 1)) {
            ns.print(`INFO 😷: ${target}. ${(ns.getWeakenTime(target) / 1000).toFixed(2)}s`)
            await weakenServer(ns, target);
        }
        else if (percent < 0.8) {
            ns.print(`INFO 🎈: ${target}. ${(ns.getGrowTime(target) / 1000).toFixed(2)}s`)
            await growServer(ns, target);
        }
        else {
            ns.print(`INFO 🤖: ${target}. ${(ns.getHackTime(target) / 1000).toFixed(2)}s`)
            await attack(ns, target);
        }
    }
}
