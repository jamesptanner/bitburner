import { NS } from '@ns'
import { HGWPath } from "/utils/HGW";
import { utilsPath, getAllServers } from "/utils/utils";
import { filesPath, hackHostPath, infiltratePath, findNewTargetPath, hackHostLitePath } from "/hosts/files";

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
        if (!serverInfo.backdoorInstalled) {
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
            else {
                ns.tprintf(`WARN 💻 Backdoor ${server}`);
            }
        }
        else if (serverInfo.backdoorInstalled && server && !scriptIsRunning(ns, server, hackHostPath) && !scriptIsRunning(ns, server, hackHostLitePath) && serverInfo.maxRam != 0) {
            const memReq = ns.getScriptRam(hackHostPath);
            const availableRam = serverInfo.maxRam - serverInfo.ramUsed;
            ns.print(`Mem: available:${availableRam}, total:${serverInfo.maxRam}, needed:${memReq} threads=${Math.floor(availableRam / memReq)}`);
            if (Math.floor(availableRam / memReq) != 0) {
                await ns.scp([HGWPath, hackHostPath, utilsPath, filesPath, findNewTargetPath], target);
                if (ns.exec(hackHostPath, server, Math.floor(availableRam / memReq), target) == 0) {
                    ns.tprintf(`failed to launch script on ${server}`);
                }
            }
            else {
                ns.tprintf(`WARN Switching to lite hack script. for ${server}`)

                const liteMemReq = ns.getScriptRam(hackHostLitePath);
                ns.print(`Mem: available:${availableRam}, total:${serverInfo.maxRam}, needed:${liteMemReq} threads=${Math.floor(availableRam / liteMemReq)}`);
                if (Math.floor(availableRam / liteMemReq) != 0) {
                    await ns.scp([HGWPath, hackHostLitePath, utilsPath, filesPath], server);
                    if (ns.exec(hackHostLitePath, server, Math.floor(availableRam / liteMemReq), target) == 0) {
                        ns.tprintf(`failed to launch script on ${server}`);
                    }
                }
                else {
                    ns.tprintf(`ERROR Unable to run either hack script.`)
                    ignoreHosts.push(server)
                    await ns.write("ignoreHosts.txt", JSON.stringify(ignoreHosts), "w")
                }
            }
        }
    }
    await ns.write("toBackdoor.txt", JSON.stringify(toBackdoor), "w");
}

const scriptIsRunning = function (ns: NS, host: string, script: string): boolean {
    return ns.ps(host).filter(process => process.filename == script).length > 0;
}