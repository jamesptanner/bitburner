import { NS } from '@ns';
import { factions } from 'shared/factions';
import { getAugmentsAvailableFromFaction } from '../shared/factions';
import { initLogging, logging } from '/shared/logging';
import { makeTable } from '/shared/ui';

export const listAugmentsPath = "/utils/listAugments.js";

export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    ns.clearLog()
    ns.tail()

    logging.info(`Getting list of augments`)

    const playerInFaction = (faction:string):boolean =>{
        return ns.getPlayer().factions.indexOf(faction) !== -1
    }
    factions.forEach(faction => {
        const augments = getAugmentsAvailableFromFaction(ns, faction)
        if (augments.length > 0) {
            const headers= ['augment','reputation','price']
            const data = augments.map(aug=>{return [aug,ns.nFormat(ns.singularity.getAugmentationRepReq(aug), '(0.000a)'),ns.nFormat(ns.singularity.getAugmentationPrice(aug), '($0.00a)')]})
            logging.info(`${faction}: ${playerInFaction(faction)? ns.nFormat(ns.singularity.getFactionRep(faction), '(0.000a)') : "Locked"}`)
            logging.info(makeTable(ns,headers,data,1))
        }
    })
}