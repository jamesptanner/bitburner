import { NS } from '@ns';
import { Dijkstra, Graph, Node } from 'dijkstra-pathfinder';


export function asString(val: unknown): string {
  if (typeof val === "string") return val;
  return String(val);
}
export function asNumber(val: unknown): number {
  if (typeof val === "number") return val;
  return NaN;
}

export function asBoolean(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  return false;
}

export const isInstanceOf = <T>(ctor: new (...args: unknown[]) => T) =>
    (x: unknown): x is T => x instanceof ctor;

export function is2DArray<T>(val: unknown, elementGuard: (x: unknown) => x is T): val is T[][] {
  return Array.isArray(val) && val.every((va) => Array.isArray(va) && va.every(elementGuard));
}

export const unique = <T>(v:T,i:number,self:T[]) => {return self.indexOf(v)===i}

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
        return self.indexOf(v) === i && v !== "home" && !ns.fileExists("ignore.txt",v);
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
    servers.push("home")
    servers.forEach(server => {
        if(!graph.findNodeByPayload(server)) {graph.addNode(new Node(server))}
        const neighbours = ns.scan(server)
        neighbours.forEach(neighbour => {
            if(!graph.findNodeByPayload(neighbour)){
                graph.addNode(new Node(neighbour))
            }
            graph.addArc(graph.findNodeByPayload(server),graph.findNodeByPayload(neighbour))
        })

    })

    const startNode = graph.findNodeByPayload(start)
    const endNode =  graph.findNodeByPayload(end)
    if(startNode && endNode) {
        const dijkstra = new Dijkstra(graph,startNode)
        dijkstra.calculate();
        const path =dijkstra.getPathTo(endNode)
        if(path){
            return path.map(node => node.payload) || []
        }
    }
    return []
}

export const needToFocus = function(ns:NS): boolean{
    if(ns.singularity.getOwnedAugmentations(false).indexOf("Neuroreceptor Management Implant") !== -1) return false
    return true
}