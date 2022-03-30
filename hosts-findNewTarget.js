function asString(val) {
    if (typeof val === "string")
        return val;
    return String(val);
}
function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}

const hackHostPath = "/hosts/hackHost.js";

async function main(ns) {
    const oldTarget = asString(ns.args[0]);
    const target = findBestTarget(ns);
    const serverInfo = ns.getServer(oldTarget);
    ns.tprintf(`INFO: ${oldTarget} attacking ${target} instead.`);
    const memReq = ns.getScriptRam(hackHostPath);
    const availableRam = serverInfo.maxRam - serverInfo.ramUsed;
    if (ns.exec(hackHostPath, oldTarget, Math.floor(availableRam / memReq), target) == 0) {
        ns.tprintf(`failed to launch script on ${oldTarget}`);
    }
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

export { main };
