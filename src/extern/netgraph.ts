import { NS } from '@ns'
import { getAllServers } from '/shared/utils';

export const netgraphPath ="/extern/netgraph.js";

export async function main(ns : NS) : Promise<void> {
    let dotText = "digraph Hosts {\n"
    const servers = getAllServers(ns)
    servers.push("home")
    const serverMap = new Map<string,string>()

    servers.forEach(host => {
        const serverInfo = ns.getServer(host)
        dotText = dotText + `nd_${servers.indexOf(host)} [label = "${host}\n${serverInfo.requiredHackingSkill}" color=${serverInfo.backdoorInstalled||serverInfo.purchasedByPlayer?"green":(serverInfo.openPortCount>=serverInfo.numOpenPortsRequired? "yellow":"red")}]\n`
        serverMap.set(host, `nd_${servers.indexOf(host)}`)
    })
    servers.forEach(host => {
        const hosts = ns.scan(host)
        if(hosts.length != 0){
            dotText = dotText + `${serverMap.get(host)} -> {${hosts.map(host => serverMap.get(host)).join()}}\n`
        }    
    })

    dotText = dotText + "}"
    ns.tprintf(dotText)
    await ns.write("dot.txt",dotText,"w")
}