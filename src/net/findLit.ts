import { NS } from '@ns'
import { walk } from '/utils/utils'

export async function main(ns: NS): Promise<void> {
    await walk(ns, "home", async (ns, host): Promise<boolean> => {
        if (typeof host === 'string') {
            const lit = ns.ls(host, ".lit")
            if (lit.length > 0) {
                await ns.scp(lit, host, "home")
            }
        }
        return true;
    });
}