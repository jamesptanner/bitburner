import { NS } from "@ns";
import { growServer, weakenServer, hackServer } from "/shared/HGW";

export const hackHostPath ="/hosts/hackHost.js";

export async function main(ns: NS): Promise<void> {
    const flags = ns.flags([['host',ns.getHostname()]])
    const target = flags.host;

    ns.tprintf(`INFO hacking target: ${target}`);
    if (typeof target === 'string') {
        while (true) {
            const current = ns.getServerMoneyAvailable(target)
            const max = ns.getServerMaxMoney(target)
            const percent = current / max;
            // ns.tprintf(`${target} money, curr:${current} max:${max} ${percent}%%`)
            if (!(ns.getServerSecurityLevel(target) < ns.getServerMinSecurityLevel(target) + 1)) {
                ns.print(`INFO 😷: ${target}. ${(ns.getWeakenTime(target) / 1000).toFixed(2)}s`)
                await weakenServer(ns, target);
            }
            else if (percent < 1) {
                ns.print(`INFO 🎈: ${target}. ${(ns.getGrowTime(target) / 1000).toFixed(2)}s`)
                await growServer(ns, target);
            }
            else {
                ns.print(`INFO 🤖: ${target}. ${(ns.getHackTime(target) / 1000).toFixed(2)}s`)
                await hackServer(ns, target);
            }
        }
    }
}
