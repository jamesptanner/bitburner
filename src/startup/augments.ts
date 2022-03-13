import { NS } from '@ns'
import {improveFactionReputation, unlockFaction,factionUnlockRequirements,getUniqueAugmentsAvailableFromFaction,factions} from 'shared/factions'


export const augmentsPath = "/cron/augments.js";

const intersection = function <T>(a: T[], b: T[]): T[] {
    return a.filter(aVal => {
        return b.indexOf(aVal) !== -1
    })
}

const chooseAFaction = function (ns: NS): string {
    const factionsToComplete = factions.filter(faction => {
        return getUniqueAugmentsAvailableFromFaction(ns, faction).length != 0
    })
    if (factionsToComplete.length == 1) return factionsToComplete[0]
    const factionInvites = ns.checkFactionInvitations()
    if (factionInvites.length > 0) {
        const readyNow = intersection(factionInvites, factionsToComplete)
        if (readyNow.length > 0) return readyNow[0]
    }
    return factionsToComplete.filter(faction =>{
        const requirements = factionUnlockRequirements.get(faction)
        if(!requirements?.not) return true
        if(requirements.not.faction && intersection(requirements.not.faction,ns.getPlayer().factions).length > 0) return false
        if(requirements.not.employers && intersection(requirements.not.employers,ns.getPlayer().jobs).length > 0) return false
        return true
    })[0]
}

/**
 * Attempt to purchase a augmentation from a faction. If we fail to purchase 3 times after meeting the criteria then fail.
 * @param ns 
 * @param faction faction to buy from
 * @param augment augment to buy
 */
const purchaseAugment = async function (ns: NS, faction: string, augment: string) {
    ns.printf(`INFO: buying ${augment} from ${faction}`)
    let purchaseAttempt = 0
    while (!ns.purchaseAugmentation(faction, augment) && purchaseAttempt < 3) {

        while (ns.getPlayer().money < ns.getAugmentationPrice(augment)) {
            await ns.sleep(1000 * 60)
        }
        purchaseAttempt++
    }
    if (purchaseAttempt === 3 && ns.getOwnedAugmentations(true).indexOf(augment) === -1) {
        ns.printf(`ERROR: failed to buy ${augment} from ${faction}`)
    }
    ns.printf(`INFO: bought ${augment} from ${faction}`)
}

const purchaseAugments = async function (ns: NS, faction: string, augments: string[]) {
    const sortedAugments = augments.sort((a, b) => {
        return ns.getAugmentationPrice(b) - ns.getAugmentationPrice(a) //prices change but the order wont.
    })
    for (const augment of sortedAugments) {
        if (ns.getAugmentationPrereq(augment).length > 0) {//handle the augment pre requirements first.
            ns.printf(`WARN: getting prerequisite for ${augment} first`)
            const unownedPrerequisites = ns.getAugmentationPrereq(augment)
                .filter(preReq => {
                    return ns.getOwnedAugmentations(true).indexOf(preReq) === -1
                })
                for (const preReq of unownedPrerequisites) {
                    await purchaseAugment(ns, faction, preReq)
                }
        }
        await purchaseAugment(ns, faction, augment)
    }

}

export async function main(ns: NS): Promise<void> {
    ns.disableLog("ALL")
    const faction = chooseAFaction(ns);
    ns.printf(`INFO: buying up all augments from ${faction}`)

    if (ns.getPlayer().factions.indexOf(faction) === -1) {
        ns.printf(`INFO: Unlocking faction ${faction}`)
        await unlockFaction(ns, faction)
        ns.joinFaction(faction)

    }
    const augments = getUniqueAugmentsAvailableFromFaction(ns, faction)
    ns.printf(`INFO: augments available [${augments}]`)
    const maxRepNeeded = augments.reduce((repNeeded, augment) => {
        return Math.max(repNeeded, ns.getAugmentationRepReq(augment))
    }, 0)

    if (ns.getFactionRep(faction) < maxRepNeeded) {
        ns.printf(`INFO: improving reputation with ${faction}`)
        await improveFactionReputation(ns, faction, maxRepNeeded)
    }
    await purchaseAugments(ns, faction, augments)
}