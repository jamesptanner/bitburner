import { NS } from '@ns'

interface Contract {
    type: string
    name: string
    host: string
    data: string
    desc: string
}

export async function main(ns : NS) : Promise<void> {
    const contractMap = JSON.parse(ns.read("contracts.txt"))
    const contractsByType = new Array<Contract>()
    for (const host in contractMap) {
        if (Object.prototype.hasOwnProperty.call(contractMap, host)) {
            const contracts = contractMap[host];
            for (let index = 0; index < contracts.length; index++) {
                const contract: Contract = {
                    name: contracts[index],
                    host: host,
                    type: ns.codingcontract.getContractType(contracts[index],host),
                    data: ns.codingcontract.getData(contracts[index],host),
                    desc: ns.codingcontract.getDescription(contracts[index],host)
                }
                //ns.print(`${host}.${contract}: ${contractType}`)
                contractsByType.push(contract)
                // ns.tprintf(`${ns.codingcontract.getDescription(contract,host)}`)
            }
        }
    }
    ns.alert(`${JSON.stringify(contractsByType)}`)
    await ns.write("processedContracts.txt",JSON.stringify(contractsByType),"w")
}