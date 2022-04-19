import { NS } from '@ns'
import { initLogging, Level, log } from '/shared/logging';
import { factions } from 'shared/factions';
import { getAugmentsAvailableFromFaction } from '../shared/factions';
import { makeTable } from '/shared/ui';

export const listAugmentsPath = "/utils/listAugments.js";

export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    ns.clearLog()
    log(Level.Info, `Getting list  of augments`)
    factions.forEach(faction => {
        const augments = getAugmentsAvailableFromFaction(ns, faction)
        if (augments.length > 0) {
            const headers= ['augment','price']
            const data = augments.map(aug=>{return [aug,ns.nFormat(ns.singularity.getAugmentationPrice(aug), '($0.00a)')]})
            ns.print(faction)
            makeTable(ns,headers,data,1)
            ns.print("")
        }
    })
}