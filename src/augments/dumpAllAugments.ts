import { NS } from '@ns'
import { factions, getAllAugmentsFromFaction } from '/shared/factions';
import { initLogging } from '/shared/logging';
import { unique } from '/shared/utils';

export const dumpAllAugmentsPath ="/augments/dumpAllAugments.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    ns.clearLog()
    const augments:string[] = ns.singularity.getOwnedAugmentations(true)
    factions.forEach(faction => {
        augments.push(...getAllAugmentsFromFaction(ns,faction))
    });
    augments.forEach(augment =>{
        const augmentInfo = ns.singularity.getAugmentationStats(augment)
        ns.print(`${augment}: ${JSON.stringify(augmentInfo)}`)
    })
}