import { NS } from '@ns';
import { infiltratePath } from "/hosts/infiltrate";
import { getAllServers } from "/shared/utils";


export async function main(ns: NS): Promise<void> {
    const toBackdoor: string[] = []
    const toInfiltrate: string[] = []
    const servers = getAllServers(ns)
    const ignoreHosts: string[] = JSON.parse(ns.read("ignoreHosts.txt") || "[]");

    for (const server of servers.filter(x => ignoreHosts.indexOf(x) == -1)) {

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
                ns.tprintf(`INFO nav via ${routeToHost(ns, 'home', server)}`)
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