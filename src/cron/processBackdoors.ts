import { NS } from '@ns'
import { canUseSingularity, routeToHost } from '/shared/utils';

export const processBackdoorsPath ="/cron/processBackdoors.js";

export async function main(ns : NS) : Promise<void> {
    if (canUseSingularity(ns)) {
        const hosts: Array<string> = JSON.parse(ns.read("toBackdoor.txt"))
        hosts.forEach(async host => {
            const hops = routeToHost(ns,ns.getHostname(),host)
            if (hops){
                hops.forEach(hop => ns.connect(hop))
                ns.tprintf(`INFO: installing backdoor ${host}`)
                ns.connect(host)
                await ns.installBackdoor();
            }
        });
    }
}