import { NS } from '@ns'
import { prepareHostPath } from '/batching/prepareHost';
import { findBestTarget, getAllServers } from '/shared/utils';

export const hackingDaemonPath ="/batching/hackingDaemon.js";

export async function main(ns: NS): Promise<void> {
    const target = findBestTarget(ns)
    const servers = getAllServers(ns)
    // prepare the server for attack. max mon, min sec.
    for(const server of servers){
        await ns.scp(prepareHostPath,server)
    }
    //throw everything we have at it and wait for the threads to finish.
    const prepPid = servers.map(server => { 
        return ns.exec(prepareHostPath, server, 1, target) 
    })
    do {
        const finished = prepPid.filter(pid => !ns.isRunning(pid,""))
        finished.forEach(pid => prepPid.splice(prepPid.indexOf(pid),1))
        await ns.sleep(30*1000)
    } while (prepPid.length > 0)
}