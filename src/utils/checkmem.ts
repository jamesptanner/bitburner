import { NS } from '@ns';
import { initLogging, logging } from '/shared/logging';

export const checkmemPath ="/utils/checkmem.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    ns.disableLog('ALL')
    ns.tail()
    ns.clearLog()
    ns.ls("home",".js").forEach(script =>{
        const totalMem = ns.getServerMaxRam('home')
        const mem = ns.getScriptRam(script)
        const memPercent = mem/totalMem

        const level = memPercent > 0.5 ? memPercent > 1 ? "ERROR": "WARN":"INFO"
        logging.info(`${level} ${script}: ${mem}GB`) 
    })
}