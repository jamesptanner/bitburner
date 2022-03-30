function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}
async function cacheAllServers(ns) {
    const alreadyScanned = [];
    let allHosts = ns.scan("home");
    const hosts = ns.scan("home");
    while (hosts.length > 0) {
        const currentHost = hosts.pop();
        if (alreadyScanned.indexOf(currentHost) != -1) {
            continue;
        }
        const scanned = ns.scan(currentHost);
        hosts.push(...scanned);
        allHosts.push(...scanned);
        alreadyScanned.push(currentHost);
    }
    allHosts = allHosts.filter((v, i, self) => {
        return self.indexOf(v) === i && v !== "home";
    });
    await ns.write("hosts.txt", JSON.stringify(Array.from(allHosts)), "w");
    return allHosts;
}

const getHostsPath = "/startup/getHosts.js";
async function main(ns) {
    await cacheAllServers(ns);
    const serverInfos = new Map();
    getAllServers(ns).forEach(async (server) => {
        const collectedServerInfo = ns.getServer(server);
        const serverInfo = {
            cores: collectedServerInfo.cpuCores,
            maxMoney: collectedServerInfo.moneyMax,
            minSecurity: collectedServerInfo.minDifficulty
        };
        serverInfos.set(server, serverInfo);
    });
    await ns.write(`servers.txt`, JSON.stringify(Object.fromEntries(serverInfos)), "w");
}

export { getHostsPath, main };
