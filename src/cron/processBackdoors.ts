import { NS } from '@ns';
import { routeToHost } from '/shared/utils';

export const processBackdoorsPath = "/cron/processBackdoors.js";

export async function main(ns: NS): Promise<void> {
    const hosts: Array<string> = JSON.parse(ns.read("toBackdoor.txt"))
    if (hosts.length > 0) {
        ns.tprintf(`need to backdoor : ${hosts.join()}`)
        for (const host of hosts) {
            ns.singularity.connect("home")
            ns.tprintf(`backdooring ${host} starting at home}`)
            const hops = routeToHost(ns, 'home', host)
            if (hops && hops.length > 0) {
                ns.tprintf(`routing via ${hops}`)

                hops.forEach(hop => ns.singularity.connect(hop))
                ns.tprintf(`INFO: installing backdoor ${host}`)
                await ns.singularity.installBackdoor();
            }
        }
        ns.printf(`returning home`)
        ns.singularity.connect("home")
        ns.rm("toBackdoor.txt","home");
    }
}