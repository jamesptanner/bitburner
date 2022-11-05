import { NS } from '@ns';
import { initLogging,logging } from '/shared/logging';

export const ScriptServerPath ="/servers/ScriptServer.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    ns.disableLog('ALL')
    ns.tail()
    const opts = ns.flags([["host","home"]])

    if(opts.host === ""){
        logging.warning(`no servername provided`)
    }
    const maxMem = ns.ls("home",".js").reduce<number>((maxMem,script)=>{
        return Math.max(maxMem,ns.getScriptRam(script,"home"))
    },0)
    const serverMem = 2 << Math.ceil(Math.log2(maxMem)) +1
    logging.info(`min server mem wanted: ${serverMem}GB`)
    logging.info(`server cost: ${ns.nFormat(ns.getPurchasedServerCost(serverMem),"$(0.000a)")}`)

    while(ns.getPlayer().money < ns.getPurchasedServerCost(serverMem)){await ns.sleep(100)}

    const newHost = ns.purchaseServer(opts.host as string, serverMem)
    if (newHost === "") {
        logging.error("Failed to purchase server", true)
        ns.exit()
    }
    else {
        logging.success(`purchased server ${newHost} size: ${serverMem}GB`,true)
    }
    logging.info(`setting up ${newHost} with files`)
    await ns.write("ignore.txt","","w")
    await ns.scp(ns.ls("home",".js"),newHost)
    await ns.scp(ns.ls("home","ignore.txt"),newHost)
    ns.rm("ignore.txt")
}