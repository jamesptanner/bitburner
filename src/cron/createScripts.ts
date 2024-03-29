import { NS } from '@ns';
import { scripts } from '/shared/HGW';
import { initLogging,logging } from '/shared/logging';


export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    const player = ns.getPlayer();
    for (const iterator of scripts) {
        const script = iterator[0];
        const cost = iterator[1];
        if (!ns.fileExists(script) && player.skills.hacking >= cost) {
            logging.info(`You should work on new script: ${script}`);
            if(!ns.singularity.isBusy() || ns.singularity.getCurrentWork()==="CREATE_PROGRAM"){
                logging.info(`working on new script ${script}`)
                ns.singularity.createProgram(script,true)
            }
            if(!ns.singularity.isFocused()){
                logging.info(`focusing on current work. ${ns.singularity.getCurrentWork().type}`)
                ns.singularity.setFocus(true)
            }
        }
    }
}