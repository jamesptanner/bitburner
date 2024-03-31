import { NS } from "@ns";
import { growServer, weakenServer } from "/shared/HGW";
import { initLogging, logging } from "/shared/logging";
export const prepareHostPath ="/batching/prepareHost.js";

export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    const target = ns.args[0];
   logging.info(`preparing target: ${target}`);
    if (typeof target === 'string') {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if ((ns.getServerSecurityLevel(target) > ns.getServerMinSecurityLevel(target))) {
                logging.info(`😷: ${target}. ${(ns.getWeakenTime(target) / 1000).toFixed(2)}s`)
                await weakenServer(ns, target);
            }
            else if (ns.getServerMoneyAvailable(target) < ns.getServerMaxMoney(target) ) {
                logging.info(`🎈: ${target}. ${(ns.getGrowTime(target) / 1000).toFixed(2)}s`)
                await growServer(ns, target);
            }
            else {
                break;
            }
        }
    }
}
