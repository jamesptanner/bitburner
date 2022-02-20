import { NS } from "@ns";
import { growServer, weakenServer, attack } from "/utils/HGW";
import { getAllServers } from "/utils/utils";

export const hackHostPath ="/hosts/hackHost.js";

export async function main(ns: NS): Promise<void> {
    let target = ns.args[0];
    ns.tprintf(`INFO hacking target: ${target}`);
    if (typeof target === 'string') {
        const max = ns.getServerMaxMoney(target)

        if (max==0){
            ns.tprintf(`WARN: ${target} doesn't have any cash.`)
            const oldtarget  = target
            target = findBestTarget(ns)
            ns.tprintf(`INFO: ${oldtarget} attacking ${target} instead.`)

        }

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
    }
}

const findBestTarget = function(ns:NS): string{
    let maxFunds = 0;
    let bestServer ="";
    getAllServers(ns).forEach(server =>{
        const serverDetails = ns.getServer(server)
        if(serverDetails.backdoorInstalled && serverDetails.moneyMax > maxFunds){
            bestServer = server;
            maxFunds = serverDetails.moneyMax
        }
    })
    return bestServer
}