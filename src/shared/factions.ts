import { needToFocus } from "/shared/utils";

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

const waitToBackdoor = async function (ns:NS, server:string){
    ns.printf(`Waiting for ${server} to be backdoored`)
    while(!ns.getServer(server).backdoorInstalled)
    {
        if(ns.getPlayer().workType !== "Studying or Taking a class at university") {
            ns.printf(`improving hacking skills at uni`)
            //improve hacking skill
            if(!ns.getPlayer().isWorking){
                if(ns.travelToCity('Volhaven')){ ns.universityCourse("ZB Institute of Technology","Algorithms")}
            }
        }
        await ns.sleep(60*1000)
    }
    if(ns.getPlayer().workType === "Studying or Taking a class at university"){
        ns.stopAction()
    }
}

const repForNextRole = function(ns:NS,corpName:string): number {
    const charInfo = ns.getCharacterInformation()
    // typedef is incorrect for deprecated charInfo.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore 
  switch(charInfo.jobTitles[charInfo.jobs.indexOf(corpName)])
  {
    case  "IT Intern":
    return 7e3
    case "Software Engineering Intern":
    case "Business Intern":
    return 8e3
    case "IT Analyst":
    return 35e3
    case "Junior Software Engineer":
    case "Business Analyst":
    return 40e3
    case "IT Manager":
    return 175e3
    case "Senior Software Engineer":
    return 200e3
    case "Lead Software Developer":
    return 400e3
    case "Systems Administrator":
    case "Head of Software":
    return 800e3
    case "Head of Engineering":
    return 1.6e6
    case "Vice President of Technology":
    return 3.2e6

  }
  return Infinity
}

const improveCorporateReputation = async function(ns:NS,corpName: string, reputation:number){
    ns.printf(`Waiting to impove reputation with ${corpName}`)
    while(ns.getCompanyRep(corpName)< reputation){
        ns.applyToCompany(corpName,"software")
            ns.workForCompany(corpName)
            const currentRep = ns.getCompanyRep(corpName)
            while(currentRep + (ns.getPlayer().workRepGained*2) < reputation ||
            currentRep + (ns.getPlayer().workRepGained*2) < repForNextRole(ns,corpName) ){
                await ns.sleep(60*1000)
                if(!ns.isBusy()){
                    ns.workForCompany(corpName)
                    
                }
                const repNeeded = ((reputation - currentRep)*2 )-ns.getPlayer().workRepGained

                ns.printf(`INFO:RepNeeded: ${repNeeded}, repGain: ${ns.getPlayer().workRepGainRate*5}`)
                ns.printf(`INFO:estimated time remaining: ${ns.tFormat(repNeeded*1000 / (ns.getPlayer().workRepGainRate*5))}`)

            }
            ns.stopAction()
    }
}

export const unlockFaction = async function (ns: NS, faction: string): Promise<boolean> {
    if (ns.getPlayer().factions.indexOf(faction) !== -1) return true
    if (getAvailableFactions(ns).indexOf(faction) !== -1) {
        return true
    }

    //need to put the work in to unlock the faction. 
    const requirements = factionUnlockRequirements.get(faction)
    if (!requirements) return false;

    while(ns.getPlayer().factions.indexOf(faction) === -1){
        
        if(requirements.augments){
            if (requirements.augments > ns.getOwnedAugmentations(false).length){
                ns.printf(`Not enough augments installed ${ns.getOwnedAugmentations(false)}/${requirements.augments}`)
                return false;
            }
        }
        if(requirements.location && ns.getPlayer().location !== requirements.location){
            ns.travelToCity(requirements.location)
        }
        if(requirements.cash && ns.getPlayer().money < requirements.cash){
            await ns.sleep(1000*60)
        }
        if(requirements.combatSkill){
            // await improveCombatSkills(ns,requirements.combatSkill)
            return false

        }
        if(requirements.hacking){
            // await improveHackingSkill(ns,requirements.hacking)
            return false

        }
        if(typeof requirements.corp == 'string' && typeof requirements.corpRep == 'number'){
            await improveCorporateReputation(ns,requirements.corp,requirements.corpRep)

        }
        if(requirements.hackingLevels || requirements.hackingRAM || requirements.hackingCPU){
            // await hacknetBuyAtLeast(ns,requirements.hackingLevels, requirements.hackingRAM, requirements.hackingCPU)
            return false

        }
        if(requirements.karma){
            // await workOnKarma(ns,requirements.karma)
            return false

        }
        if(requirements.backdoor){
            await waitToBackdoor(ns,requirements.backdoor)
        }
        ns.joinFaction(faction)
    }
    return true;
}

export const improveFactionReputation = async function (ns: NS, faction: string, reputation: number): Promise<void> {
    while (reputation > ns.getFactionRep(faction) + (ns.getPlayer().currentWorkFactionName === faction ? ns.getPlayer().workRepGained : 0)) {
        ns.tail()
        ns.printf(`INFO: current faction relationship ${faction} is ${ns.nFormat(ns.getFactionRep(faction) + (ns.getPlayer().currentWorkFactionName === faction ? ns.getPlayer().workRepGained : 0), "0,0.000")}, want ${reputation}.`)
        ns.printf(`INFO: Time Remaining: ${(ns.getPlayer().currentWorkFactionName === faction ? ns.tFormat(((reputation - (ns.getFactionRep(faction) + ns.getPlayer().workRepGained)) / (ns.getPlayer().workRepGainRate * 5)) * 1000, false) : "unknown")}`)
        if (!ns.isBusy()) {
            ns.printf(`INFO: improving relationship with ${faction}`)
            ns.workForFaction(faction, "hacking", true)
        }
        if (!ns.isFocused() && needToFocus(ns)) {
            ns.printf(`focusing on work. ${ns.getPlayer().currentWorkFactionName}`)
            ns.setFocus(true)
        }
        await ns.sleep(1000 * 60)
    }
    ns.stopAction()
}