import { NS } from '@ns';
import { simpleNodesPath } from '/hacknet/simpleNodes';
import { hasFormulas } from '/shared/HGW';

export const hacknetPath ="/autorun/hacknet.js";

export async function main(ns : NS) : Promise<void> {
    if(ns.fileExists("hacknet_stop.txt","home")){
        ns.tprintf(`WARN: Not running script. hacknet_stop.txt found.`)
        ns.exit() 
    }
    if (!hasFormulas(ns)){
        ns.exec(simpleNodesPath,"home")
    }
    else {
        ns.exec(simpleNodesPath,"home")
    }
}