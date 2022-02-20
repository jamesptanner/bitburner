import { NS } from '@ns'

import { scripts } from '/utils/HGW';

export async function main(ns: NS): Promise<void> {
    const player = ns.getPlayer();
    while (true) {
        for (const iterator of scripts) {
            const script = iterator[0];
            const cost = iterator[1];
            if (!ns.fileExists(script) && player.hacking >= cost) {
                ns.tprintf(`INFO: You should work on new script: ${script}`);
            }
        }
    }
}