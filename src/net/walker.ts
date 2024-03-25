import { NS } from '@ns';
import { infiltratePath } from "/hosts/infiltrate";
import { getAllServers, routeToHost } from "/shared/utils";
import { initLogging,logging } from '/shared/logging';

export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    const toBackdoor: string[] = []
    const toInfiltrate: string[] = []
    const servers = getAllServers(ns)
    const ignoreHosts: string[] = JSON.parse(ns.read("ignoreHosts.txt") as string || "[]");

    for (const server of servers.filter(x => ignoreHosts.indexOf(x) === -1)) {

        const serverInfo = ns.getServer(server);
        if (!serverInfo.backdoorInstalled && !serverInfo.purchasedByPlayer) {
            if (!serverInfo.hasAdminRights) {
                const targetHackLevel = ns.getServerRequiredHackingLevel(server);
                if (targetHackLevel <= ns.getHackingLevel()) {
                    logging.info(`INFO 💣 ${server}`);

                    if (!serverInfo.purchasedByPlayer) {
                        if(ns.exec(infiltratePath, "home", 1, server) ===0){
                            if(toInfiltrate.length === 0) logging.warning(`not enough memory to auto infiltrate. Waiting till end.`)
                            toInfiltrate.push(server);

                        }
                    }
                }
            }
            else if(serverInfo.requiredHackingSkill && serverInfo.requiredHackingSkill <= ns.getPlayer().skills.hacking){
                logging.warning(`💻 Backdoor ${server}`);
                logging.info(`nav via ${routeToHost(ns, 'home', server)}`)
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