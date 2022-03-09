import { NS } from '@ns';

import { Graph, Node, Dijkstra } from 'dijkstra-pathfinder'

export function asString(val: (string | number | boolean)): string{
    if (typeof val === "string") return val;
    return String(val);
}
export function asNumber(val: (string | number | boolean)): number{
    if (typeof val === "number") return val;
    return NaN;
}

export function asBoolean(val: (string | number | boolean)): boolean{
    if (typeof val === "boolean") return val;
    return false;
}

export async function walk(ns: NS, start: string, func: (host: string | undefined) => Promise<boolean>): Promise<void> {
    const alreadyScanned = [];
    const hosts = ns.scan(start);
    while (hosts.length > 0) {
        const currentHost = hosts.pop();
        if (alreadyScanned.indexOf(currentHost) != -1) {
            continue;
        }
        hosts.push(...ns.scan(currentHost));
        const cont = await func(currentHost);
        if (!cont)
            break;
        alreadyScanned.push(currentHost);
    }
}

export function getAllServers(ns:NS): string[]{
     return JSON.parse(ns.read("hosts.txt"))
}

export async function cacheAllServers(ns:NS): Promise<string[]>{
    const alreadyScanned = [];
    let allHosts = ns.scan("home")
    const hosts = ns.scan("home");
    while (hosts.length > 0) {
        const currentHost = hosts.pop();
        if (alreadyScanned.indexOf(currentHost) != -1) {
            continue;
        }
        const scanned = ns.scan(currentHost)
        hosts.push(...scanned);
        allHosts.push(...scanned)
        alreadyScanned.push(currentHost);
    }
    allHosts = allHosts.filter((v,i,self) =>{
        return self.indexOf(v) === i && v !== "home";
    })

    await ns.write("hosts.txt",JSON.stringify(Array.from(allHosts)),"w")
    return allHosts
}


export const findBestTarget = function(ns:NS): string{
    let maxFunds = 0;
    let bestServer ="";
    getAllServers(ns).forEach(server =>{
        const serverDetails = ns.getServer(server)
        if(serverDetails.backdoorInstalled && serverDetails.moneyMax > maxFunds){
            bestServer = server;
            maxFunds = serverDetails.moneyMax
        }
    })
    return bestServer
}

export const canUseSingularity = function(ns:NS):boolean {
    return (ns.getOwnedSourceFiles().filter(x => { return x.n === 4 }).length !== 0)
}

export interface ServerInfo {
    cores: number
    maxMoney: number
    minSecurity: number
}

export const getConstServerInfo = function(ns:NS, host:string): ServerInfo | undefined{
    const servers = new Map<string,ServerInfo>(JSON.parse(ns.read("servers.txt")))
    return servers.get(host)
}

export const routeToHost = function(ns: NS, start: string, end:string): string[] {
    const graph = new Graph()
    const servers = getAllServers(ns)
    const nodes = new Map<string,Node>()
    servers.forEach(server => {
        const node = nodes.get(server) || new Node(server)
        
        const neighbours = ns.scan(server)
        neighbours.forEach(neighbour => {
            if(!nodes.has(neighbour)){
                const neighbourNode = new Node(neighbour)
                nodes.set(neighbour,neighbourNode)
                graph.addArc(node,neighbourNode)
            }
        })

    })
    const startNode = nodes.get(start)
    const endNode = nodes.get(end)
    if(startNode && endNode) {
        return new Dijkstra(graph,startNode).getPathTo(endNode)?.map(node => node.payload) || []
    }
    return []
}