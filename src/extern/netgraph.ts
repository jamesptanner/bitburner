import { NS } from '@ns'
import { getAllServers } from '/utils/utils';

export const netgraphPath ="/extern/netgraph.js";

export async function main(ns : NS) : Promise<void> {
    let dotText = "digraph Hosts {\n"
    const servers = getAllServers(ns)
    servers.push("home")
    const serverMap = new Map<string,string>()

    servers.forEach(host => {
        const serverInfo = ns.getServer(host)
        dotText = dotText + `nd_${servers.indexOf(host)} [label = "${host}" color=${serverInfo.backdoorInstalled?"green":"red"}]\n`
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