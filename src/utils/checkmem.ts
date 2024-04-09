import { NS } from '@ns';
import { Logging } from '/shared/logging';

export const checkmemPath ="/utils/checkmem.js";

export async function main(ns : NS) : Promise<void> {
    const logging = new Logging(ns);
    ns.disableLog('ALL')
    ns.tail()
    ns.clearLog()
    ns.ls("home",".js").forEach(script =>{
        const totalMem = ns.getServerMaxRam('home')
        const mem = ns.getScriptRam(script)
        const memPercent = mem/totalMem
        let level = "ERROR"
        if (memPercent > 0) {
            if ( memPercent < 0.5) level = "INFO";
            else if (memPercent < 1) level = "WARN";
        }
        logging.info(`${level} ${script}: ${mem}GB`) 
    })
}