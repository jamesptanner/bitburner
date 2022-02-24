import { NS } from '@ns'
import { getAllServers } from '/utils/utils';

export const killscriptPath ="/killscript.js";

export async function main(ns : NS) : Promise<void> {
    const target = ns.args[0] || "";
    ns.tprintf(`INFO killing script: ${target}`)
    if (typeof target === 'string') {
    
        getAllServers(ns).forEach( host => {
            ns.ps(host).filter(x => target ==="" ||x.filename.indexOf(target)>-1).forEach(x =>{
            ns.kill(x.pid)});
        })
        ns.tprintf(`INFO: done killing all instances of ${target}`)
    }
}