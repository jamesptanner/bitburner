import { NS } from '@ns';
import { scripts } from '/shared/HGW';
import { initLogging,logging } from '/shared/logging';


export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    const player = ns.getPlayer();
    for (const iterator of scripts) {
        const script = iterator[0];
        const cost = iterator[1];
        if (!ns.fileExists(script) && player.hacking >= cost) {
            // ns.tprintf(`INFO: You should work on new script: ${script}`);
            if(!ns.singularity.isBusy() || ns.getPlayer().workType.includes('program')){
                logging.info(`working on new script ${script}`)
                ns.singularity.createProgram(script,true)
            }
            if(!ns.singularity.isFocused()){
                logging.info(`focusing on current work. ${ns.getPlayer().workType}`)
                ns.singularity.setFocus(true)
            }
        }
    }
}