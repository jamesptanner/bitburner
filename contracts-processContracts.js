const solveContractPath = "/contracts/solveContract.js";

const processContractsPath = "/contracts/processContracts.js";
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
            }
        }
    }
    await ns.write("processedContracts.txt", JSON.stringify(contractsByType), "w");
    contractsByType.forEach(contract => {
        ns.exec(solveContractPath, "home", 1, contract.name, contract.host);
    });
}

export { main, processContractsPath };
