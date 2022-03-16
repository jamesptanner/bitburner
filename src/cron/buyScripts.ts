import { NS } from '@ns'

export const buyScriptsPath ="/cron/buyScripts.js";

export async function main(ns : NS) : Promise<void> {
    const player = ns.getPlayer()
    if(!player.tor){
        if(!ns.purchaseTor()){
            ns.printf(`not enough money to buy tor router`)
            ns.exit()
        }
    }
    for (const scriptInfo of scripts) {
        const {script} = iterator;
        if (!ns.fileExists(script)) {
           if(!ns.purchaseProgram(script)){
               ns.printf(`not enough money to buy ${script}`)
           }
        }
    }
}