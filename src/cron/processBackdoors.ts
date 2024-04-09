import { NS } from '@ns';
import { routeToHost } from '/shared/utils';
import { Logging } from '/shared/logging';


export const processBackdoorsPath = "/cron/processBackdoors.js";

export async function main(ns: NS): Promise<void> {
    
    const logging = new Logging(ns);
    if(!ns.fileExists("toBackdoor.txt")){
        logging.warning("no backdorr file found.");
        return;
    }

    const hosts: Array<string> = JSON.parse(ns.read("toBackdoor.txt")  as string)
    if (hosts.length > 0) {
        logging.info(`need to backdoor : ${hosts.join()}`)
        for (const host of hosts) {
            logging.info(`backdooring ${host} starting at home`)
            const hops = routeToHost(ns, 'home', host)
            if (hops && hops.length > 0) {
                try {
                    logging.info(`routing via ${hops}`)
                    ns.singularity.connect("home")
                    hops.forEach(hop => ns.singularity.connect(hop))
                    if(!ns.getServer(host).hasAdminRights){
                        logging.info(`installing backdoor ${host}`)
                        await ns.singularity.installBackdoor();
                    }
                }
                catch (e) {
                    if (e instanceof Error) {
                        logging.error(e.message)
                    }
                }
            }
        }
        try {
            logging.info(`returning home`)
            ns.singularity.connect("home")
            ns.rm("toBackdoor.txt", "home");
        }
        catch (e) {
            if (e instanceof Error) {
                logging.error(e.message)
            }
        }
    }
}