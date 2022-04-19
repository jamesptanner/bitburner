import { NS } from '@ns'
import { factions, getAllAugmentsFromFaction } from '/shared/factions';
import { initLogging } from '/shared/logging';

export const dumpAllAugmentsPath ="/augments/dumpAllAugments.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    ns.clearLog()
    const augments:string[] = ns.singularity.getOwnedAugmentations(true)
    factions.forEach(faction => {
        augments.push(...getAllAugmentsFromFaction(ns,faction))
    });
    const augmentInfo = augments.map(augment =>{ return ns.singularity.getAugmentationStats(augment)})
    export interface AugmentationStats {
        /** Multiplier to Bladeburner max stamina */
        bladeburner_max_stamina_mult?: number;
        /** Multiplier to Bladeburner stamina gain rate */
        bladeburner_stamina_gain_mult?: number;
        /** Multiplier to effectiveness in Bladeburner Field Analysis */
        bladeburner_analysis_mult?: number;
        /** Multiplier to success chance in Bladeburner contracts/operations */
        bladeburner_success_chance_mult?: number;
      }
    const headers = ['augment','hack','str','def','dex','agi','cha', 'hack xp', 'str xp', 'def xp', 'dex xp', 'agi xp', 'cha xp',
        'hack chance','hack speed','hack money','hack growth','comp rep','fact rep','crime mon','crime succ','work mon',
        'hacknet node mon','hacknet node cost','hacknet ram cost','hacknet core cost','hacknet level cost',
        'bladeburn stamina','bladeburn stamina gain','bladeburn analysis','bladeburn sucess']
}