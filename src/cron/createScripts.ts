import { NS } from '@ns'

import { scripts } from '/shared/HGW';

export async function main(ns: NS): Promise<void> {
    const player = ns.getPlayer();
    for (const iterator of scripts) {
        const script = iterator[0];
        const cost = iterator[1];
        if (!ns.fileExists(script) && player.hacking >= cost) {
            // ns.tprintf(`INFO: You should work on new script: ${script}`);
            if(!ns.singularity.isBusy() || ns.getPlayer().workType.includes('Program')){
                ns.printf(`INFO: working on new script ${script}`)
                ns.singularity.createProgram(script,true)
            }
            if(!ns.singularity.isFocused()){
                ns.printf(`focusing on current work. ${ns.getPlayer().workType}`)
                ns.singularity.setFocus(true)
            }
        }
    }
}