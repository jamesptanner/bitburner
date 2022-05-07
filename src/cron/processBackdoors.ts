import { NS } from '@ns';
import { routeToHost } from '/shared/utils';
import { initLogging,logging } from '/shared/logging';

export const processBackdoorsPath = "/cron/processBackdoors.js";

export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    const hosts: Array<string> = JSON.parse(ns.read("toBackdoor.txt"))
    if (hosts.length > 0) {
        logging.info(`need to backdoor : ${hosts.join()}`)
        for (const host of hosts) {
            ns.singularity.connect("home")
            logging.info(`backdooring ${host} starting at home}`)
            const hops = routeToHost(ns, 'home', host)
            if (hops && hops.length > 0) {
                logging.info(`routing via ${hops}`)

                hops.forEach(hop => ns.singularity.connect(hop))
                logging.info(`installing backdoor ${host}`)
                await ns.singularity.installBackdoor();
            }
        }
        logging.info(`returning home`)
        ns.singularity.connect("home")
        ns.rm("toBackdoor.txt","home");
    }
}