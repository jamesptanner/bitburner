export const factionsPath ="/shared/factions.js";

export const factions: string[] = [
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
export const factionUnlockRequirements: Map<string, FactionUnlockRequirements> = new Map([
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

export const getAvailableFactions = function (ns: NS): string[] {
    const player = ns.getPlayer()
    return factions.filter(faction => {
        return player.factions.indexOf(faction) != -1 ||
            ns.checkFactionInvitations().indexOf(faction) != -1
    })
}

export const getAugmentsAvailableFromFaction = function (ns: NS, faction: string): string[] {
    return ns.getAugmentationsFromFaction(faction).filter(augment => {
        return ns.getOwnedAugmentations(true).indexOf(augment) == -1
    })
}

export const getUniqueAugmentsAvailableFromFaction = function (ns: NS, faction: string): string[] {
    return getAugmentsAvailableFromFaction(ns, faction).filter(augment => {
        return augment !== "NeuroFlux Governor"
    })
}

export const unlockFaction = async function (ns: NS, faction: string) {
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

export const improveFactionReputation = async function (ns: NS, faction: string, reputation: number) {
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