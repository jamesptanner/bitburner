function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}

const processContractsPath = "/contracts/processContracts.js";

async function main(ns) {
    const contracts = new Map();
    ns.print(`INFO searching for contracts.`);
    getAllServers(ns).forEach(host => {
        if (typeof host === 'string') {
            contracts.set(host, ns.ls(host, ".cct"));
        }
    });
    await ns.write("contracts.txt", JSON.stringify(Object.fromEntries(contracts)), "w");
    ns.spawn(processContractsPath);
}

export { main };
