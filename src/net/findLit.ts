import { NS } from '@ns'
import { getAllServers } from '/utils/utils'

export async function main(ns: NS): Promise<void> {
    getAllServers(ns).forEach(async (host) => {
        if (typeof host === 'string') {
            const lit = ns.ls(host, ".lit")
            if (lit.length > 0) {
                await ns.scp(lit, host, "home")
            }
        }
    });
}