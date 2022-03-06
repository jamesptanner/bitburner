import { NS } from '@ns'
import { getAllServers } from '/shared/utils'

export async function main(ns: NS): Promise<void> {
    getAllServers(ns).forEach(async (host) => {
            const lit = ns.ls(host, ".lit")
            if (lit.length > 0) {
                await ns.scp(lit, host, "home")
            }
    });
}