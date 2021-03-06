import { NS } from '@ns';
import { getAllServers } from '/shared/utils';
import { initLogging,logging } from '/shared/logging';

export const killscriptPath ="/utils/killscript.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    ns.disableLog('ALL')
    const target = ns.args[0] || "";
    logging.info(`killing script: ${target}`)
    if (typeof target === 'string') {
    
        getAllServers(ns).forEach( host => {
            ns.ps(host).filter(x => target ==="" ||x.filename.indexOf(target)>-1).forEach(x =>{
            ns.kill(x.pid)});
        })
        logging.info(`Done killing all instances of ${target}`)
    }
}