import { NS } from '@ns'

export const augmentsPath = "/cron/augments.js";

const factions: string[] = [
    "CyberSec",
    "Tian Di Hui",
    "Netburners",
    "Sector-12",
    "Chongqing",
    "New Tokyo",
    "Ishima",
    "Aevum",
    "Volhaven",
    "NiteSec",
    "The Black Hand",
    "BitRunners",
    "ECorp",
    "MegaCorp",
    "KuaiGong International",
    "Four Sigma",
    "NWO",
    "Blade Industries",
    "OmniTek Incorporated",
    "Bachman & Associates",
    "Clarke Incorporated",
    "Fulcrum Secret Technologies",
    "Slum Snakes",
    "Tetrads",
    // "Silhouette",                //crime faction not interested in handling yet.
    // "Speakers for the Dead",     //crime faction not interested in handling yet.
    // "The Dark Army",             //crime faction not interested in handling yet.
    // "The Syndicate",             //crime faction not interested in handling yet.
    "The Covenant",
    "Daedalus",
    "Illuminati",
    // "Bladeburners",              //not sure who these are yet.
    // "Church of the Machine God", //not sure who these are yet.
];

type FactionExclusions = {
    faction?: string[]
    employers?: string[]

}
type FactionUnlockRequirements = {
    location?: string,
    backdoor?: string,
    hacking?: number,
    hackingLevels?: number,
    hackingRAM?: number,
    hackingCPU?: number,
    cash?: number,
    corp?: string,
    corpRep?: number,
    combatSkill?: number,
    karma?: number,
    not?: FactionExclusions,
    augments?: number,
}
const factionUnlockRequirements: Map<string, FactionUnlockRequirements> = new Map([
    ["CyberSec", {
        backdoor: 'CSEC',
    }],
    ["Tian Di Hui", {
        cash: 1000000,
        hacking: 50,
        location: "Chongqing"
    }],
    ["Netburners", {
        hacking: 80,
        hackinglevel: 100,
        hackingRAM: 8,
        hackingCPU: 4
    }],
    ["Sector-12", {
        location: "Sector-12",
        cash: 15000000,
        not: {
            faction: [
                "Chongqing",
                "New Tokyo",
                "Ishima",
                "Volhaven"
            ]
        }
    }],
    ["Chongqing", {
        location: "Chongqing",
        cash: 20000000,
        not: {
            faction: [
                "Sector-12",
                "Aevum",
                "Volhaven"
            ]
        }
    }],
    ["New Tokyo", {
        location: "New Tokyo",
        cash: 20000000,
        not: {
            faction: [
                "Sector-12",
                "Aevum",
                "Volhaven"
            ]
        }
    }],
    ["Ishima", {
        location: "Ishima",
        cash: 30000000,
        not: {
            faction: [
                "Sector-12",
                "Aevum",
                "Volhaven"
            ]
        }
    }],
    ["Aevum", {
        location: "Aevum",
        cash: 40000000,
        not: {
            faction: [
                "Chongqing",
                "New Tokyo",
                "Ishima",
                "Volhaven"
            ]
        }
    }],
    ["Volhaven", {
        location: "Volhaven",
        cash: 50000000,
        not: {
            faction: [
                "Sector-12",
                "Chongqing",
                "New Tokyo",
                "Ishima",
                "Aevum"
            ]
        }
    }],
    ["NiteSec", {
        backdoor: "avmnite-02h"
    }],
    ["The Black Hand", {
        backdoor: "I.I.I.I"
    }],
    ["BitRunners", {
        backdoor: "run4theh111z"
    }],
    ["ECorp", {
        corp: "ECorp",
        corpRep: 200000
    }],
    ["MegaCorp", {
        corp: "MegaCorp",
        corpRep: 200000

    }],
    ["KuaiGong International", {
        corp: "KuaiGong International",
        corpRep: 200000

    }],
    ["Four Sigma", {
        corp: "Four Sigma",
        corpRep: 200000

    }],
    ["NWO", {
        corp: "NWO",
        corpRep: 200000

    }],
    ["Blade Industries", {
        corp: "Blade Industries",
        corpRep: 200000

    }],
    ["OmniTek Incorporated", {
        corp: "OmniTek Incorporated",
        corpRep: 200000

    }],
    ["Bachman & Associates", {
        corp: "Bachman & Associates",
        corpRep: 200000

    }],
    ["Clarke Incorporated", {
        corp: "Clarke Incorporated",
        corpRep: 200000

    }],
    ["Fulcrum Secret Technologies", {
        corp: "Fulcrum Secret Technologies",
        corpRep: 200000,
        backdoor: "fulcrumassets"
    }],
    ["Slum Snakes", {
        combatSkill: 30,
        karma: -9,
        cash: 1000000
    }],
    ["Tetrads", {
        location: "Chongqing",
        combatSkill: 75,
        karma: -22
    }],
    ["The Covenant", {
        augments: 20,
        cash: 75000000000,
        hacking: 850,
        combatSkill: 850
    }],
    ["Daedalus", {
        augments: 30,
        cash: 100000000000,
        hacking: 2500,
    }],
    ["Illuminati", {
        augments: 30,
        cash: 150000000000,
        hacking: 1500,
        combatSkill: 1200
    }]
])

const getAvailableFactions = function (ns: NS): string[] {
    const player = ns.getPlayer()
    return factions.filter(faction => {
        return player.factions.indexOf(faction) != -1 ||
            ns.checkFactionInvitations().indexOf(faction) != -1
    })
}

const getAugmentsAvailableFromFaction = function (ns: NS, faction: string): string[] {
    return ns.getAugmentationsFromFaction(faction).filter(augment => {
        return ns.getOwnedAugmentations(true).indexOf(augment) == -1
    })
}

const getUniqueAugmentsAvailableFromFaction = function (ns: NS, faction: string): string[] {
    return getAugmentsAvailableFromFaction(ns, faction).filter(augment => {
        return augment !== "NeuroFlux Governor"
    })
}

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

const unlockFaction = async function (ns: NS, faction: string) {
    if (ns.getPlayer().factions.indexOf(faction) !== -1) return
    if (getAvailableFactions(ns).indexOf(faction) !== -1) {
        return
    }

    //need to put the work in to unlock the faction. 
    const requirements = factionUnlockRequirements.get(faction)
    if (!requirements) return;

    // while(ns.getPlayer().factions.indexOf(faction) === -1){
    //     if(requirements.location){
    //         ns.travelToCity(location)
    //     }
    //     if(requirements.cash){
    //         await ns.sleep(1000*60)
    //     }
    //     if(requirements.combatSkill){
    //         await improveCombatSkills(ns,requirements.combatSkill)
    //     }
    //     if(requirements.hacking){
    //         await improveHackingSkill(ns,requirements.hacking)
    //     }
    //     if(requirements.corp){
    //         await improveCorporateReputation(ns,requirements.corp,requirements.corpRep)
    //     }
    //     if(requirements.hackingLevels || requirements.hackingRAM || requirements.hackingCPU){
    //         await hacknetBuyAtLeast(ns,requirements.hackingLevels, requirements.hackingRAM, requirements.hackingCPU)
    //     }
    //     if(requirements.karma){
    //         await workOnKarma(ns,requirements.karma)
    //     }
    //     backdoor?: string,


    //     not?: FactionExclusions,
    //     augments?: number,
    // }
}

const improveFactionReputation = async function (ns: NS, faction: string, reputation: number) {
    while (reputation > ns.getFactionRep(faction) + ns.getPlayer().workRepGained) {
        ns.tail()
        ns.printf(`INFO: current faction relationship ${faction} is ${ns.nFormat(ns.getFactionRep(faction) + ns.getPlayer().workRepGained, "0,0.000")}, want ${reputation}. Remaining ${ns.tFormat(((reputation - (ns.getFactionRep(faction) + ns.getPlayer().workRepGained)) / (ns.getPlayer().workRepGainRate * 5)) * 1000, false)}`)
        if (!ns.isBusy()) {
            ns.printf(`INFO: improving relationship with ${faction}`)
            ns.workForFaction(faction, "hacking", true)
        }
        if (!ns.isFocused()) {
            ns.printf(`focusing on work. ${ns.getPlayer().currentWorkFactionName}`)
            ns.setFocus(true)
        }
        await ns.sleep(1000 * 60)
    }
    ns.stopAction()
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