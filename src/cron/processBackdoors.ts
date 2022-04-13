import { NS } from '@ns'
import { routeToHost } from '/shared/utils';
import { MapWindowPath } from '/ui/MapWindow';

export const processBackdoorsPath = "/cron/processBackdoors.js";

export async function main(ns: NS): Promise<void> {
    const hosts: Array<string> = JSON.parse(ns.read("toBackdoor.txt"))
    if (hosts.length > 0) {
        ns.tprintf(`need to backdoor : ${hosts.join()}`)
        for (const host of hosts) {
            ns.tprintf(`backdooring ${host} starting at ${ns.singularity.getCurrentServer()}`)
            const hops = routeToHost(ns, ns.singularity.getCurrentServer(), host)
            if (hops && hops.length > 0) {
                ns.tprintf(`routing via ${hops}`)

                hops.forEach(hop => ns.singularity.connect(hop))
                ns.tprintf(`INFO: installing backdoor ${host}`)
                await ns.singularity.installBackdoor();
            }
        }
        ns.printf(`returning home`)
        const hops = routeToHost(ns, ns.singularity.getCurrentServer(), "home")
        if (hops && hops.length > 0) {
            ns.tprintf(`routing via ${hops}`)
            hops.forEach(hop => ns.singularity.connect(hop))
        }
        ns.rm("toBackdoor.txt","home");
        ns.spawn(MapWindowPath)
    }
}