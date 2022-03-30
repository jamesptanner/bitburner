function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}
const findBestTarget = function (ns) {
    let maxFunds = 0;
    let bestServer = "";
    getAllServers(ns).forEach(server => {
        const serverDetails = ns.getServer(server);
        if (serverDetails.backdoorInstalled && serverDetails.moneyMax > maxFunds) {
            bestServer = server;
            maxFunds = serverDetails.moneyMax;
        }
    });
    return bestServer;
};

const killscriptPath = "/utils/killscript.js";

const updateBestHostPath = "/cron/updateBestHost.js";
async function main(ns) {
    const currentBest = ns.read("target.txt");
    const target = findBestTarget(ns);
    if (currentBest != target) {
        ns.tprintf(`Updating target old:${currentBest} new:${target}`);
        await ns.write("target.txt", target, "w");
        ns.exec(killscriptPath, "home", 1, "hack");
        ns.exec("net/walker.js", "home");
    }
}

export { main, updateBestHostPath };
