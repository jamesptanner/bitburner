const clearContractsPath = "/contracts/clearContracts.js";
async function main(ns) {
    const contractMap = JSON.parse(ns.read("contracts.txt"));
    const contractsByType = new Array();
    for (const host in contractMap) {
        if (Object.prototype.hasOwnProperty.call(contractMap, host)) {
            const contracts = contractMap[host];
            for (let index = 0; index < contracts.length; index++) {
                const contract = {
                    name: `${contracts[index]}`,
                    host: host,
                };
                contractsByType.push(contract);
                ns.rm(contracts[index], host);
            }
        }
    }
}

export { clearContractsPath, main };
