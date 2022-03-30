function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}

const netgraphPath = "/extern/netgraph.js";
async function main(ns) {
    const dotText = createDotGraph(ns);
    ns.tprintf(dotText);
    await ns.write("dot.txt", dotText, "w");
}
function createDotGraph(ns) {
    let dotText = "digraph Hosts {";
    const servers = getAllServers(ns);
    servers.push("home");
    const serverMap = new Map();
    servers.forEach(host => {
        const serverInfo = ns.getServer(host);
        dotText = dotText + `nd_${servers.indexOf(host)} [label = "${host}\\n${serverInfo.requiredHackingSkill}" color=${serverInfo.backdoorInstalled || serverInfo.purchasedByPlayer ? "green" : (serverInfo.openPortCount >= serverInfo.numOpenPortsRequired && serverInfo.requiredHackingSkill <= ns.getPlayer().hacking ? "yellow" : "red")}]`;
        serverMap.set(host, `nd_${servers.indexOf(host)}`);
    });
    servers.forEach(host => {
        const hosts = ns.scan(host);
        if (hosts.length != 0) {
            dotText = dotText + `${serverMap.get(host)} -> {${hosts.map(host => serverMap.get(host)).join()}}`;
        }
    });
    dotText = dotText + "}";
    return dotText;
}

export { createDotGraph, main, netgraphPath };
