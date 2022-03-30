function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}

async function main(ns) {
    const servers = getAllServers(ns);
    for (const host of servers) {
        const lit = ns.ls(host, ".lit");
        if (lit.length > 0) {
            await ns.scp(lit, host, "home");
        }
    }
}

export { main };
