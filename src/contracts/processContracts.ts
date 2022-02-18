import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    const contractMap = JSON.parse(ns.read("contracts.txt"))

    for (const host in contractMap) {
        if (Object.prototype.hasOwnProperty.call(contractMap, host)) {
            const contracts = contractMap[host];
            for (let index = 0; index < contracts.length; index++) {
                const contract = contracts[index];
                ns.print(`${host}.${contract}: ${ns.codingcontract.getContractType(contract,host)}`)
                // ns.tprintf(`${ns.codingcontract.getDescription(contract,host)}`)
            }
        }
    }

}