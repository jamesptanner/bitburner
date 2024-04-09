import { NS } from '@ns';
import { scripts } from '/shared/HGW';
import { Logging } from '/shared/logging';



export async function main(ns: NS): Promise<void> {
    const logging = new Logging(ns);
    
    const player = ns.getPlayer();
    for (const iterator of scripts) {
        const script = iterator[0];
        const cost = iterator[1];
        if (!ns.fileExists(script) && player.skills.hacking >= cost) {
            logging.info(`You should work on new script: ${script}`);
            const currentWork = ns.singularity.getCurrentWork();
            if(!ns.singularity.isBusy() || (currentWork && currentWork.type === "CREATE_PROGRAM")){
                logging.info(`working on new script ${script}`)
                ns.singularity.createProgram(script,true)
            }
            if(!ns.singularity.isFocused() && currentWork){
                logging.info(`focusing on current work. ${currentWork.type}`)
                ns.singularity.setFocus(true)
            }
        }
    }
}