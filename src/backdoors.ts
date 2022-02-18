import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    const hosts: Array<string> = JSON.parse(ns.read("toBackdoor.txt"))
    hosts.forEach(async host =>{
        ns.tprintf(`INFO: installing backdoor ${host}`)
        ns.connect(host)
        await ns.installBackdoor();
    });
}