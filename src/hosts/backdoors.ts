import { NS } from '@ns'
import { canUseSingularity } from '/shared/utils';

export async function main(ns: NS): Promise<void> {
    if (canUseSingularity(ns)) {
        const hosts: Array<string> = JSON.parse(ns.read("toBackdoor.txt"))
        hosts.forEach(async host => {
            ns.tprintf(`INFO: installing backdoor ${host}`)
            ns.connect(host)
            await ns.installBackdoor();
        });
    }
}