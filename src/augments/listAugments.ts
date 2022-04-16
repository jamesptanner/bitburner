import { NS } from '@ns'
import { initLogging,Level,log } from '/shared/logging';
import { factions } from 'shared/factions';
import { getAugmentsAvailableFromFaction } from './../shared/factions';

export const listAugmentsPath ="/utils/listAugments.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
     log(Level.Info,`Getting list  of augments`)
    factions.forEach(faction =>{
        const augments = getAugmentsAvailableFromFaction(ns,faction)
        if (augments.length >0){
            log(Level.Info,`faction: ${faction}, augments: [\n${augments.join(",\n")}\n]\n`)
        }
    })
}