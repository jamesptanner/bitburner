import { NS } from '@ns';
import { log } from './../shared/logging';
import { initLogging, Level } from '/shared/logging';

export const checkCostsPath ="/servers/checkCosts.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    ns.tail()
    ns.clearLog()

    let mem = 2
    while(mem <= ns.getPurchasedServerMaxRam()){
        log(Level.Info,`${Math.log2(mem)} : ${mem}GB = ${ns.nFormat(Math.round(ns.getPurchasedServerCost(mem)),'($ 0.00 a)')}`)
        mem <<= 1
    }
}