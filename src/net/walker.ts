import { NS } from '@ns'
import { getAllServers } from "/shared/utils";

import {infiltratePath} from "/hosts/infiltrate"
import {hackHostPath} from "/hosts/hackHost"

export async function main(ns: NS): Promise<void> {
    const toBackdoor: string[] = []
    const toInfiltrate: string[] = []
    const servers = getAllServers(ns)
    const ignoreHosts: string[] = JSON.parse(ns.read("ignoreHosts.txt") || "[]");
    const preferredTarget: string = ns.read("target.txt") || ""

    if (preferredTarget) {
        ns.tprintf(`INFO coordinating attack on ${preferredTarget}`)
    }
    for (const server of servers.filter(x => ignoreHosts.indexOf(x) == -1)) {
        const target = preferredTarget || server

        const serverInfo = ns.getServer(server);
        if (!serverInfo.backdoorInstalled && !serverInfo.purchasedByPlayer) {
            if (!serverInfo.hasAdminRights) {
                const targetHackLevel = ns.getServerRequiredHackingLevel(server);
                if (targetHackLevel <= ns.getHackingLevel()) {
                    ns.tprintf(`INFO 💣 ${server}`);

                    if (!serverInfo.purchasedByPlayer) {
                        if(ns.exec(infiltratePath, "home", 1, server) ===0){
                            if(toInfiltrate.length == 0)ns.tprintf(`WARN: not enough memory to auto infiltrate. Waiting till end.`)
                            toInfiltrate.push(server);

                        }
                    }
                }
            }
            else if(serverInfo.requiredHackingSkill <= ns.getPlayer().hacking){
                ns.tprintf(`WARN 💻 Backdoor ${server}`);
                toBackdoor.push(server);
            }
        }
    }
    await ns.write("toBackdoor.txt", JSON.stringify(toBackdoor), "w");
    if(toInfiltrate.length > 0){
        await ns.write("toInfiltrate.txt", JSON.stringify(toInfiltrate), "w");
        ns.spawn(infiltratePath,1)
    }
}

const scriptIsRunning = function (ns: NS, host: string, script: string): boolean {
    return ns.ps(host).filter(process => process.filename == script).length > 0;
}