import { NS } from '@ns'
import { HGWPath } from "/utils/HGW";
import { utilsPath, getAllServers } from "/utils/utils";
import { filesPath, hackHostPath, infiltratePath,findNewTargetPath } from "/hosts/files";

export async function main(ns: NS): Promise<void> {
    const toBackdoor: string[] = []
    const servers = getAllServers(ns)
    for(const server of servers)
    {
        const serverInfo = ns.getServer(server);
        if (!serverInfo.backdoorInstalled) {
            const targetHackLevel = ns.getServerRequiredHackingLevel(server);
            if (targetHackLevel <= ns.getHackingLevel()) {
                ns.tprintf(`INFO 💣 ${server}`);

                if (!serverInfo.purchasedByPlayer) {
                    ns.exec(infiltratePath, "home", 1, server);
                    toBackdoor.push(server);
                }
            }
        }
        else if (serverInfo.backdoorInstalled && server && !scriptIsRunning(ns, server, hackHostPath)) {
            await ns.scp([HGWPath, hackHostPath, utilsPath,filesPath,findNewTargetPath], server);
            const memReq = ns.getScriptRam(hackHostPath);
            const availableRam = serverInfo.maxRam - serverInfo.ramUsed;
            ns.tprintf(`Mem: available:${availableRam}, total:${serverInfo.maxRam}, needed:${memReq} threads=${Math.floor(availableRam / memReq)}`);
            if (Math.floor(availableRam / memReq) != 0) {
                if (ns.exec(hackHostPath, server, Math.floor(availableRam / memReq), server) == 0) {
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