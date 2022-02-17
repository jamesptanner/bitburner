import { NS } from '@ns'

import { scripts } from '/HGW';

export async function main(ns: NS): Promise<void> {
    const player = ns.getPlayer();
    while (true) {
        ns.tprintf(`INFO: Checking if we can make any scripts`);
        for (const iterator of scripts) {
            const script = iterator[0];
            const cost = iterator[1];
            if (!ns.fileExists(script) && player.hacking >= cost) {
                if (!ns.isBusy()) {
                    ns.tprintf(`INFO: starting work on new script: ${script}`);
                    //ns.createProgram(script);
                }
            }
        }
        await ns.sleep(5 * 60 * 1000);
    }
}