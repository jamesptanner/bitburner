const infiltratePath = "/hosts/infiltrate.js";

function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}

async function main(ns) {
    const toBackdoor = [];
    const toInfiltrate = [];
    const servers = getAllServers(ns);
    const ignoreHosts = JSON.parse(ns.read("ignoreHosts.txt") || "[]");
    for (const server of servers.filter(x => ignoreHosts.indexOf(x) == -1)) {
        const serverInfo = ns.getServer(server);
        if (!serverInfo.backdoorInstalled && !serverInfo.purchasedByPlayer) {
            if (!serverInfo.hasAdminRights) {
                const targetHackLevel = ns.getServerRequiredHackingLevel(server);
                if (targetHackLevel <= ns.getHackingLevel()) {
                    ns.tprintf(`INFO 💣 ${server}`);
                    if (!serverInfo.purchasedByPlayer) {
                        if (ns.exec(infiltratePath, "home", 1, server) === 0) {
                            if (toInfiltrate.length == 0)
                                ns.tprintf(`WARN: not enough memory to auto infiltrate. Waiting till end.`);
                            toInfiltrate.push(server);
                        }
                    }
                }
            }
            else if (serverInfo.requiredHackingSkill <= ns.getPlayer().hacking) {
                ns.tprintf(`WARN 💻 Backdoor ${server}`);
                toBackdoor.push(server);
            }
        }
    }
    await ns.write("toBackdoor.txt", JSON.stringify(toBackdoor), "w");
    if (toInfiltrate.length > 0) {
        await ns.write("toInfiltrate.txt", JSON.stringify(toInfiltrate), "w");
        ns.spawn(infiltratePath, 1);
    }
}

export { main };
