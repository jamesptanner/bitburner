import { NS } from '@ns'
import { walk } from './utils';

export async function main(ns : NS) : Promise<void> {
    const target = ns.args[0] || "";
    ns.tprintf(`INFO killing script: ${target}`)
    if (typeof target === 'string') {
    
        await walk(ns,"home",async (ns,host,target): Promise<boolean> => {
            ns.ps(host).filter(x => target ==="" ||x.filename ===target).forEach(x =>{
            ns.kill(x.pid)});

            return true;
        },target)

    }
}