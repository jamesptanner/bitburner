import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    const target = ns.args[0] || "";
    ns.tprintf(`INFO killing script: ${target}`)
    if (typeof target === 'string') {
    }

    ns.ps().filter(x => target ==="" ||x.filename ===target).forEach(x =>{
ns.kill(x.pid);
    });
}