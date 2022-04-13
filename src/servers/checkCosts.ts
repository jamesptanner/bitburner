import { NS } from '@ns'
import { initLogging, Level } from '/shared/logging';
import { log } from './../shared/logging';

export const checkCostsPath ="/servers/checkCosts.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)

    let mem = 2
    while(mem <= ns.getPurchasedServerMaxRam()){
        log(Level.Info,`${Math.log2(mem)} : ${mem}GB = ${ns.nFormat(Math.round(ns.getPurchasedServerCost(mem)),'($ 0.00 a)')}`)
        mem <<= 1
    }
}