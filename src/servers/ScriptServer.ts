import { NS } from '@ns';
import { initLogging } from '/shared/logging';

export const ScriptServerPath ="/servers/ScriptServer.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    ns.disableLog('ALL')

    const opts = ns.flags([["host","home"]])

    if(opts.host === ""){
        ns.tprintf(`no servername provided`)
    }
    ns.tail()
    ns.clearLog()
    const maxMem = ns.ls("home",".js").reduce<number>((maxMem,script)=>{
        return Math.max(maxMem,ns.getScriptRam(script,"home"))
    },0)
    const serverMem = 2 << Math.ceil(Math.log2(maxMem)) +1
    ns.print(`min server mem wanted: ${serverMem}GB`)
    ns.print(`server cost: ${ns.nFormat(ns.getPurchasedServerCost(serverMem),"$(0.000a)")}`)
    const newHost = ns.purchaseServer(opts.host, serverMem)
    if (newHost === "") {
        ns.toast("Failed to purchase server", "error")
        ns.exit()
    }
    else {
        ns.toast(`purchased server ${newHost} size: ${serverMem}GB`)
    }
    ns.print(`setting up ${newHost} with files`)
    await ns.write("ignore.txt","","w")
    await ns.scp(ns.ls("home",".js"),newHost)
    await ns.scp(ns.ls("home","ignore.txt"),newHost)
    ns.rm("ignore.txt")
}