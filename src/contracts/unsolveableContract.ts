import { NS } from '@ns'
import { initLogging, warning } from '/shared/logging';

export const unsolveableContractPath ="/contracts/unsolveableContract.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    const args = ns.flags([["file",""],["host",""]])
    if(args.host === "" || args.file === ""){
        warning("Not enough info to find contract",true)
        ns.exit()
    }
    const filename = args.file as string
    const host = args.host as string
    const contractDesc = ns.codingcontract.getDescription(filename,host)
    const contractData = ns.codingcontract.getData(filename,host)
    const contractType = ns.codingcontract.getContractType(filename,host)

    await ns.write(filename.replace('cct','txt'),[contractType,contractData,contractDesc].join('\n\n'),'w')
}