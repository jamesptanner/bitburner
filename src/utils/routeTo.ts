import { NS } from '@ns';
import { initLogging } from '/shared/logging';
import { routeToHost } from '/shared/utils';

export const routeToPath ="/utils/routeTo.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)

    const opts  = ns.flags([["host","home"]])
    const hops = routeToHost(ns, ns.singularity.getCurrentServer(), opts.host)
    if (hops && hops.length > 0) {
        ns.tprintf(`routing via ${hops}`)
        hops.forEach(hop => ns.singularity.connect(hop))
    }
}