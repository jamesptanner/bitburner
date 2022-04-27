import { NS } from '@ns';
import { runHacknet } from '/hacknet/simpleNodes';

export const lowMemPath = "/playmode/lowMem.js";

export async function main(ns: NS): Promise<void> {

    //not using usual logging until we have more memory.
    // await initLogging(ns) 
    while (ns.getServerMaxRam('home') <= 32) {
        await runHacknet(ns, () => { 
            return ns.getPlayer().money < ns.getServerMaxRam('home') * 3.2e4 * Math.pow(1.58,Math.log2(ns.getServerMaxRam('home'))) 
        })
        ns.tprint(`Ready to buy at least 32gb memory`)
        await ns.sleep(15*60*1000)
    }
}

