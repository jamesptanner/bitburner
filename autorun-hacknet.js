const simpleNodesPath = "/hacknet/simpleNodes.js";

function hasFormulas(ns) {
    return ns.fileExists("Formulas.exe");
}

const hacknetPath = "/autorun/hacknet.js";
async function main(ns) {
    if (ns.fileExists("hacknet_stop.txt", "home")) {
        ns.tprintf(`WARN: Not running script. hacknet_stop.txt found.`);
        ns.exit();
    }
    if (!hasFormulas(ns)) {
        ns.exec(simpleNodesPath, "home");
    }
}

export { hacknetPath, main };
