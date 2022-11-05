import { NS } from '@ns';
import { initLogging,logging } from '/shared/logging';
import { routeToHost } from '/shared/utils';

export const routeToPath ="/utils/routeTo.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    ns.disableLog('ALL')
    ns.tail()
    const opts  = ns.flags([["host","home"]])
    const hops = routeToHost(ns, ns.singularity.getCurrentServer(), opts.host as string)
    if (hops && hops.length > 0) {
        logging.info(`routing via ${hops}`)
        hops.forEach(hop => ns.singularity.connect(hop))
    }
}