import { NS } from "@ns";
import { hackServer, weakenServer } from "/shared/HGW";
import { initLogging, logging} from '/shared/logging';

export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    const target = ns.args[0];
   logging.info(`Draining target: ${target}`);
    if (typeof target === 'string') {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (!(ns.getServerSecurityLevel(target) < ns.getServerMinSecurityLevel(target) + 1)) {
                logging.info(`😷: ${target}. ${(ns.getWeakenTime(target) / 1000).toFixed(2)}s`)
                await weakenServer(ns, target);
            }
            else {
                logging.info(`🤖: ${target}. ${(ns.getHackTime(target) / 1000).toFixed(2)}s`)
                await hackServer(ns, target);
            }
        }
    }
}
