import { NS } from '@ns';
import { factions, factionUnlockRequirements, getAvailableFactions, getUniqueAugmentsAvailableFromFaction, improveFactionReputation, unlockFaction } from 'shared/factions';
import { getAugmentsAvailableFromFaction } from '/shared/factions';
import { initLogging, logging } from '/shared/logging';


export const augmentsPath = "/cron/augments.js";

const intersection = function <T>(a: T[], b: T[]): T[] {
    return a.filter(aVal => {
        return b.indexOf(aVal) !== -1
    })
}

const chooseAFaction = function (ns: NS, skipFactions:string[]): string {
    const factionsToComplete = factions.filter(faction => {
        return getUniqueAugmentsAvailableFromFaction(ns, faction).length !== 0
    })
    if (factionsToComplete.length === 1) return factionsToComplete[0]
    const factionInvites = ns.singularity.checkFactionInvitations()
    if (factionInvites.length > 0) {
        const readyNow = intersection(factionInvites, factionsToComplete)
        if (readyNow.length > 0) return readyNow[0]
    }
    return factionsToComplete.filter(faction =>{
        if(skipFactions.indexOf(faction)!==-1) return false
        const requirements = factionUnlockRequirements.get(faction)
        if(!requirements?.not) return true
        if(requirements.not.faction && intersection(requirements.not.faction,ns.getPlayer().factions).length > 0) return false
        if(requirements.not.employers && intersection(requirements.not.employers,Object.keys(ns.getPlayer().jobs)).length > 0) return false
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
    logging.info(`buying ${augment} from ${faction}`)
    let purchaseAttempt = 0
    while (!ns.singularity.purchaseAugmentation(faction, augment) && purchaseAttempt < 3) {
        let lastMoneyCheck = ns.getPlayer().money
        while (ns.getPlayer().money < ns.singularity.getAugmentationPrice(augment)) {
            const currentMoneyCheck = ns.getPlayer().money
            const moneyDiff = currentMoneyCheck - lastMoneyCheck
            logging.info(`estimated time remaining: ${ns.tFormat((ns.singularity.getAugmentationPrice(augment) - currentMoneyCheck) / (60*1000 /moneyDiff))}`)
            lastMoneyCheck = currentMoneyCheck
            await ns.asleep(1000 * 60)
        }
        purchaseAttempt++
    }
    if (purchaseAttempt === 3 && ns.singularity.getOwnedAugmentations(true).indexOf(augment) === -1) {
        logging.error(`failed to buy ${augment} from ${faction}`)
    }
    logging.info(`bought ${augment} from ${faction}`)
}

const purchaseAugments = async function (ns: NS, faction: string, augments: string[]) {
    const sortedAugments = augments.sort((a, b) => {
        return ns.singularity.getAugmentationPrice(b) - ns.singularity.getAugmentationPrice(a) //prices change but the order wont.
    })
    for (const augment of sortedAugments) {
        //double check we have the reputation for the augment
        if(ns.singularity.getAugmentationRepReq(augment) < ns.singularity.getFactionRep(faction)){
            await improveFactionReputation(ns,faction,ns.singularity.getAugmentationRepReq(augment))
        }

        if (ns.singularity.getAugmentationPrereq(augment).length > 0) {//handle the augment pre requirements first.
            logging.warning(`getting prerequisite for ${augment} first`)
            const unownedPrerequisites = ns.singularity.getAugmentationPrereq(augment)
                .filter(preReq => {
                    return ns.singularity.getOwnedAugmentations(true).indexOf(preReq) === -1
                })
                for (const preReq of unownedPrerequisites) {
                    await purchaseAugments(ns, faction, [preReq])
                }
        }
        await purchaseAugment(ns, faction, augment)
    }

}

export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    ns.disableLog("ALL")
    const skippedFactions:string[] = []
    //do we already have some factions we could buy from unlocked?
    const availableAugments = getAvailableFactions(ns)
        .map(faction => {
            const augs = getUniqueAugmentsAvailableFromFaction(ns,faction)
            if(augs.length > 0){
                logging.info(`faction:${faction}, augments:[${augs}]`)
            }
            return augs
        })
        .reduce((prev,augments) =>{
            return prev.concat(...augments)
        },[])
        .filter((v,i,self)=>{return self.indexOf(v)===i})

    if(availableAugments.length === 0) {
        await unlockNewFactionAndBuyAugments(ns, skippedFactions);
    }
    else {
        await buyExistingAugments(ns,availableAugments)
    }
}

async function unlockNewFactionAndBuyAugments(ns: NS, skippedFactions: string[]) {
    let faction = chooseAFaction(ns, skippedFactions);
    let unlocked = false;
    do {
        if (ns.getPlayer().factions.indexOf(faction) === -1) {
            logging.info(`Unlocking faction ${faction}`);
            unlocked = await unlockFaction(ns, faction);
            if (unlocked) {
                ns.singularity.joinFaction(faction);
            }
            else {
                logging.error(`Cant faction ${faction}`);
                skippedFactions.push(faction);
                faction = chooseAFaction(ns, skippedFactions);
            }
        }
        else {
            unlocked = true;
        }
        await ns.asleep(100);
        if (faction === undefined) {
            ns.exit();
        }
    } while (!unlocked);
    logging.info(`buying up all augments from ${faction}`);
    const augments = getUniqueAugmentsAvailableFromFaction(ns, faction);
    logging.info(`augments available [${augments}]`);
    const maxRepNeeded = augments.reduce((repNeeded, augment) => {
        return Math.max(repNeeded, ns.singularity.getAugmentationRepReq(augment));
    }, 0);

    if (ns.singularity.getFactionRep(faction) < maxRepNeeded) {
        logging.info(`improving reputation with ${faction}`);
        await improveFactionReputation(ns, faction, maxRepNeeded);
    }
    await purchaseAugments(ns, faction, augments);
}

async function buyExistingAugments(ns:NS,availableAugments:string[]){
        //turn the augments we have available into pairs of aug/faction
        const factionForAugment = availableAugments.map(augment =>{
            for (const faction of getAvailableFactions(ns)){
                if(getAugmentsAvailableFromFaction(ns,faction).indexOf(augment)!==-1){
                    return [augment,faction]
                }
            }
            return []
        })
        .filter(a => a.length === 2)
        .sort((a,b)=>{
            if(b === null) return 1
            if(a === null) return -1
            return ns.singularity.getAugmentationPrice(a[0]) - ns.singularity.getAugmentationPrice(b[0])
        })
        .reverse()
        for(const pair of factionForAugment){
            if(pair === null) continue
            const [augment,faction] = pair
            if(ns.singularity.getAugmentationRepReq(augment) < ns.singularity.getFactionRep(faction)){
                await improveFactionReputation(ns,faction,ns.singularity.getAugmentationRepReq(augment))
            }
            await purchaseAugments(ns, faction, [augment]);
        }
}