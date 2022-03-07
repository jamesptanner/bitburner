import { NS } from '@ns'
import { getAllServers } from "/shared/utils";

import {infiltratePath} from "/hosts/infiltrate"
import {hackHostPath} from "/hosts/hackHost"

export async function main(ns: NS): Promise<void> {
    const toBackdoor: string[] = []
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
                        ns.exec(infiltratePath, "home", 1, server);
                        toBackdoor.push(server);
                    }
                }
            }
            else if(serverInfo.requiredHackingSkill <= ns.getPlayer().hacking){
                ns.tprintf(`WARN 💻 Backdoor ${server}`);
            }
        }
        else if (server && !scriptIsRunning(ns, server, hackHostPath) && serverInfo.maxRam != 0) {
            const memReq = ns.getScriptRam(hackHostPath);
            const availableRam = serverInfo.maxRam - serverInfo.ramUsed;
            const threads = Math.floor(availableRam / memReq) 
            ns.print(`Mem: available:${availableRam}, total:${serverInfo.maxRam}, needed:${memReq} threads=${threads}`);
            if (Math.floor(availableRam / memReq) != 0) {
                await ns.scp([hackHostPath], server);
                if (ns.exec(hackHostPath, server, threads, target) == 0) {
                    ns.tprintf(`failed to launch script on ${server}`);
                }
            }
        }
    }
    await ns.write("toBackdoor.txt", JSON.stringify(toBackdoor), "w");
}

const scriptIsRunning = function (ns: NS, host: string, script: string): boolean {
    return ns.ps(host).filter(process => process.filename == script).length > 0;
}