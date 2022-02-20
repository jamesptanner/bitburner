import { NS } from '@ns'
import { HGWPath } from "/utils/HGW";
import { utilsPath, getAllServers } from "/utils/utils";
import { filesPath, hackHostPath, infiltratePath,findNewTargetPath,hackHostLitePath } from "/hosts/files";

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
            const memReq = ns.getScriptRam(hackHostPath);
            const availableRam = serverInfo.maxRam - serverInfo.ramUsed;
            ns.tprintf(`Mem: available:${availableRam}, total:${serverInfo.maxRam}, needed:${memReq} threads=${Math.floor(availableRam / memReq)}`);
            if (Math.floor(availableRam / memReq) != 0) {
                await ns.scp([HGWPath, hackHostPath, utilsPath,filesPath,findNewTargetPath], server);
                if (ns.exec(hackHostPath, server, Math.floor(availableRam / memReq), server) == 0) {
                    ns.tprintf(`failed to launch script on ${server}`);
                }
            }
            else {
                ns.tprintf(`WARN Switching to lite hack script. for ${server}`)

                const liteMemReq = ns.getScriptRam(hackHostLitePath);
                ns.tprintf(`Mem: available:${availableRam}, total:${serverInfo.maxRam}, needed:${liteMemReq} threads=${Math.floor(availableRam / liteMemReq)}`);
                if (Math.floor(availableRam / liteMemReq) != 0) {
                    await ns.scp([HGWPath, hackHostLitePath, utilsPath,filesPath], server);
                    if (ns.exec(hackHostLitePath, server, Math.floor(availableRam / liteMemReq), server) == 0) {
                        ns.tprintf(`failed to launch script on ${server}`);
                    }
                }
                else{
                    ns.tprintf(`ERROR Unable to run either hack script.`)
                }
            }
        }
    }
    await ns.write("toBackdoor.txt", JSON.stringify(toBackdoor), "w");
}

const scriptIsRunning = function (ns: NS, host: string, script: string): boolean {
    return ns.ps(host).filter(process => process.filename == script).length > 0;
}