import { CompanyName, NS, Skills } from "@ns";
import { Logging } from "shared/logging";
import { needToFocus } from "shared/utils";

export const factionsPath = "/shared/factions.js";

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
    "Silhouette",
    "Speakers for the Dead",
    "The Dark Army",
    "The Syndicate",
    "The Covenant",
    "Daedalus",
    "Illuminati",
    // "Bladeburners",              //not sure who these are yet.
    // "Church of the Machine God", //not sure who these are yet.
];

type FactionExclusions = {
    faction?: string[];
    employers?: string[];
};
type FactionUnlockRequirements = {
    location?: string;
    backdoor?: string;
    hacking?: number;
    hackingLevels?: number;
    hackingRAM?: number;
    hackingCPU?: number;
    cash?: number;
    corp?: string;
    corpRep?: number;
    combatSkill?: number;
    karma?: number;
    not?: FactionExclusions;
    augments?: number;
};
export const factionUnlockRequirements: Map<string, FactionUnlockRequirements> =
    new Map([
        [
            "CyberSec",
            {
                backdoor: "CSEC",
            },
        ],
        [
            "Tian Di Hui",
            {
                cash: 1000000,
                hacking: 50,
                location: "Chongqing",
            },
        ],
        [
            "Netburners",
            {
                hacking: 80,
                hackinglevel: 100,
                hackingRAM: 8,
                hackingCPU: 4,
            },
        ],
        [
            "Sector-12",
            {
                location: "Sector12",
                cash: 15000000,
                not: {
                    faction: ["Chongqing", "New Tokyo", "Ishima", "Volhaven"],
                },
            },
        ],
        [
            "Chongqing",
            {
                location: "Chongqing",
                cash: 20000000,
                not: {
                    faction: ["Sector-12", "Aevum", "Volhaven"],
                },
            },
        ],
        [
            "New Tokyo",
            {
                location: "NewTokyo",
                cash: 20000000,
                not: {
                    faction: ["Sector-12", "Aevum", "Volhaven"],
                },
            },
        ],
        [
            "Ishima",
            {
                location: "Ishima",
                cash: 30000000,
                not: {
                    faction: ["Sector-12", "Aevum", "Volhaven"],
                },
            },
        ],
        [
            "Aevum",
            {
                location: "Aevum",
                cash: 40000000,
                not: {
                    faction: ["Chongqing", "New Tokyo", "Ishima", "Volhaven"],
                },
            },
        ],
        [
            "Volhaven",
            {
                location: "Volhaven",
                cash: 50000000,
                not: {
                    faction: ["Sector-12", "Chongqing", "New Tokyo", "Ishima", "Aevum"],
                },
            },
        ],
        [
            "NiteSec",
            {
                backdoor: "avmnite-02h",
            },
        ],
        [
            "The Black Hand",
            {
                backdoor: "I.I.I.I",
            },
        ],
        [
            "BitRunners",
            {
                backdoor: "run4theh111z",
            },
        ],
        [
            "ECorp",
            {
                corp: "ECorp",
                corpRep: 200000,
            },
        ],
        [
            "MegaCorp",
            {
                corp: "MegaCorp",
                corpRep: 200000,
            },
        ],
        [
            "KuaiGong International",
            {
                corp: "KuaiGong International",
                corpRep: 200000,
            },
        ],
        [
            "Four Sigma",
            {
                corp: "Four Sigma",
                corpRep: 200000,
            },
        ],
        [
            "NWO",
            {
                corp: "NWO",
                corpRep: 200000,
            },
        ],
        [
            "Blade Industries",
            {
                corp: "Blade Industries",
                corpRep: 200000,
            },
        ],
        [
            "OmniTek Incorporated",
            {
                corp: "OmniTek Incorporated",
                corpRep: 200000,
            },
        ],
        [
            "Bachman & Associates",
            {
                corp: "Bachman & Associates",
                corpRep: 200000,
            },
        ],
        [
            "Clarke Incorporated",
            {
                corp: "Clarke Incorporated",
                corpRep: 200000,
            },
        ],
        [
            "Fulcrum Secret Technologies",
            {
                corp: "Fulcrum Technologies",
                corpRep: 200000,
                backdoor: "fulcrumassets",
            },
        ],
        [
            "Slum Snakes",
            {
                combatSkill: 30,
                karma: -9,
                cash: 1000000,
            },
        ],
        [
            "Tetrads",
            {
                location: "Chongqing",
                combatSkill: 75,
                karma: -22,
            },
        ],
        [
            "The Covenant",
            {
                augments: 20,
                cash: 75000000000,
                hacking: 850,
                combatSkill: 850,
            },
        ],
        [
            "Daedalus",
            {
                augments: 30,
                cash: 100000000000,
                hacking: 2500,
            },
        ],
        [
            "Illuminati",
            {
                augments: 30,
                cash: 150000000000,
                hacking: 1500,
                combatSkill: 1200,
            },
        ],
    ]);

export const getAvailableFactions = function (ns: NS): string[] {
    const player = ns.getPlayer();
    return factions.filter((faction) => {
        return (
            player.factions.indexOf(faction) !== -1 ||
            ns.singularity.checkFactionInvitations().indexOf(faction) !== -1
        );
    });
};

export const getAugmentsAvailableFromFaction = function (
    ns: NS,
    faction: string,
): string[] {
    return ns.singularity
        .getAugmentationsFromFaction(faction)
        .filter((augment) => {
            return ns.singularity.getOwnedAugmentations(true).indexOf(augment) === -1;
        });
};

export const getAllAugmentsFromFaction = function (
    ns: NS,
    faction: string,
): string[] {
    return ns.singularity.getAugmentationsFromFaction(faction);
};

export const getUniqueAugmentsAvailableFromFaction = function (
    ns: NS,
    faction: string,
): string[] {
    return getAugmentsAvailableFromFaction(ns, faction).filter((augment) => {
        return augment !== "NeuroFlux Governor";
    });
};

const waitToBackdoor = async function (ns: NS, server: string) {
    const logging = new Logging(ns);
    await logging.initLogging();
    logging.info(`Waiting for ${server} to be backdoored`);
    while (!ns.getServer(server).backdoorInstalled) {
        const currentWork = ns.singularity.getCurrentWork();
        if (currentWork && currentWork.type !== "CLASS") {
            logging.info(`improving hacking skills at uni`);
            //improve hacking skill
            if (!ns.singularity.isBusy()) {
                if (ns.singularity.travelToCity("Volhaven")) {
                    ns.singularity.universityCourse(
                        "ZB Institute of Technology",
                        "Algorithms",
                    );
                }
            }
        }
        await ns.asleep(60 * 1000);
    }
    const currentWork = ns.singularity.getCurrentWork();
    if (currentWork && currentWork.type === "CLASS") {
        ns.singularity.stopAction();
    }
};

const repForNextRole = function (ns: NS, corpName: string): number {
    const jobs = ns.getPlayer().jobs; 
    const postitionInfo = ns.singularity.getCompanyPositionInfo(corpName as keyof typeof jobs,(jobs[corpName as keyof typeof jobs])!)
    return postitionInfo.nextPosition !== null ? ns.singularity.getCompanyPositionInfo(corpName as keyof typeof jobs,postitionInfo.nextPosition).requiredReputation : Infinity;
};


async function aquireSkills(ns:NS, logging: Logging, requiredSkills: Skills) {
    await improveStat(ns,logging, requiredSkills.hacking,Math.max(requiredSkills.agility,requiredSkills.defense,requiredSkills.dexterity, requiredSkills.strength),requiredSkills.charisma);
}

const unlockNextRole = async function(ns:NS, corpName: CompanyName, logging: Logging){
    const currentJob = ns.getPlayer().jobs[corpName];
    if (currentJob) {
        const posInfo =ns.singularity.getCompanyPositionInfo(corpName,currentJob);
        const nextJob = posInfo.nextPosition;
        if(nextJob){
            await aquireSkills(ns,logging,ns.singularity.getCompanyPositionInfo(corpName,nextJob).requiredSkills)
        }
    }
}

const improveCorporateReputation = async function (
    ns: NS,
    corpNameAsString: string,
    reputation: number,
    logging: Logging
) {
    logging.info(`Waiting to improve reputation with ${corpNameAsString}`);
    const corpName = ns.enums.CompanyName[corpNameAsString as keyof typeof ns.enums.CompanyName];
    while (ns.singularity.getCompanyRep(corpName) < reputation) {
        ns.singularity.applyToCompany(corpName, ns.enums.JobField.software);
        ns.singularity.workForCompany(corpName);
        const currentRep = ns.singularity.getCompanyRep(corpName);
        while (currentRep < reputation) {
            await ns.asleep(60 * 1000);
            if (currentRep > repForNextRole(ns, corpName)) {
                ns.singularity.stopAction();
                await unlockNextRole(ns,corpName,logging);
                break;
            }
            if (!ns.singularity.isBusy()) {
                ns.singularity.workForCompany(corpName);
            }
            // TODO
            // const repNeeded = ((reputation - currentRep) * 2) - ns.getPlayer().workRepGained
            // logging.info(`RepNeeded: ${ns.nFormat(repNeeded, "(0.000)")}, repGain: ${ns.nFormat(ns.getPlayer().workRepGainRate * 5, "(0.000)")}`)
            // logging.info(`estimated time remaining: ${ns.tFormat(repNeeded * 1000 / (ns.getPlayer().workRepGainRate * 5))}`)
        }
        ns.singularity.stopAction();
    }
};

// const enum processRequirementsResult {
//     Failed,
//     All,
//     Some
// }

// const processRequirements = async function(requirements: PlayerRequirement[]) :processRequirementsResult{
//     for (let index = 0; index < requirements.length; index++) {
//         const requirement = requirements[index];
//         switch (requirement.type){
//             case MoneyRequirement.type:
//         }
        
//     }
// }


const workOnKarma = async function(ns:NS, karamLevel:number){

    if (ns.getPlayer().karma <= karamLevel) return;
    while(ns.getPlayer().karma > karamLevel){
        const timeToWait = ns.singularity.commitCrime("Homicide");
        await ns.asleep(timeToWait);
    }
}

const hacknetHasAtLeast = async function(ns:NS, hackingLevels: number, hackingRAM: number, hackingCPU: number){
    while (true){
        const totalNodes = ns.hacknet.numNodes();
        for (let nodeId = 0; nodeId < totalNodes  ; nodeId++) {
            const element = ns.hacknet.getNodeStats(nodeId);
            if(element.level>= hackingLevels && element.ram >= hackingRAM && element.cores >= hackingCPU) return;
        }
        await ns.asleep(60000)
    }

}

export const unlockFaction = async function (
    ns: NS,
    faction: string,
): Promise<boolean> {
    const logging = new Logging(ns);
    await logging.initLogging();
    if (ns.getPlayer().factions.indexOf(faction) !== -1) return true;
    if (getAvailableFactions(ns).indexOf(faction) !== -1) {
        ns.singularity.joinFaction(faction);
        return true;
    }

    //need to put the work in to unlock the faction.
    const requirements = factionUnlockRequirements.get(faction);
    // const requirements = ns.singularity.getFactionInviteRequirements(faction)
    if (!requirements) return false;

    while (ns.getPlayer().factions.indexOf(faction) === -1) {
        await ns.asleep(100);
        // processRequirements(requirements);
        if (requirements.augments) {
            if (
                requirements.augments >
                ns.singularity.getOwnedAugmentations(false).length
            ) {
                logging.info(
                    `Not enough augments installed ${ns.singularity.getOwnedAugmentations(false)}/${requirements.augments}`,
                );
                return false;
            }
        }
        if (
            requirements.location &&
            ns.getPlayer().location !== requirements.location
        ) {
            ns.enums.CityName[
                requirements.location as keyof typeof ns.enums.CityName
            ];
            ns.singularity.travelToCity(
                ns.enums.CityName[
                requirements.location as keyof typeof ns.enums.CityName
                ],
            );
        }
        if (requirements.cash && ns.getPlayer().money < requirements.cash) {
            logging.info(`waiting for $${ns.formatNumber(requirements.cash)}`);
            await ns.asleep(1000 * 60);
        }
        if (requirements.combatSkill) {
            logging.info(`improving combat skill to ${requirements.combatSkill}`);
            await improveStat(ns, logging, 0, requirements.combatSkill);
        }
        if (
            requirements.hacking &&
            ns.getPlayer().skills.hacking < requirements.hacking
        ) {
            logging.info(`improving hacking to ${requirements.hacking}`);

            await improveStat(ns,logging, requirements.hacking);
        }
        if (
            typeof requirements.corp === "string" &&
            typeof requirements.corpRep === "number"
        ) {
            logging.info(`improving reputation with  ${requirements.corp}`);
            await improveCorporateReputation(
                ns,
                requirements.corp,
                requirements.corpRep,
                logging
            );
        }
        if (
            requirements.hackingLevels ||
            requirements.hackingRAM ||
            requirements.hackingCPU
        ) {
            await hacknetHasAtLeast(ns,requirements.hackingLevels? requirements.hackingLevels : 0 , requirements.hackingRAM ? requirements.hackingRAM : 0, requirements.hackingCPU ?  requirements.hackingCPU: 0)
        }
        if (requirements.karma) {
            await workOnKarma(ns,requirements.karma)
        }
        if (requirements.backdoor) {
            logging.info(
                `waiting until we have a backdoor into ${requirements.backdoor}`,
            );
            await waitToBackdoor(ns, requirements.backdoor);
        }
        ns.singularity.joinFaction(faction);
    }
    return true;
};

export const improveFactionReputation = async function (
    ns: NS,
    faction: string,
    reputation: number,
): Promise<void> {
    const logging = new Logging(ns);
    await logging.initLogging();
    while (reputation > ns.singularity.getFactionRep(faction)) {
        ns.tail();
        logging.info(
            `current faction relationship ${faction} is ${ns.formatNumber(ns.singularity.getFactionRep(faction))}, want ${ns.formatNumber(reputation)}.`,
        );
        // TODO
        // logging.info(`Time Remaining: ${(ns.getPlayer()..currentWorkFactionName === faction ? ns.tFormat(((reputation - (ns.singularity.getFactionRep(faction) + ns.getPlayer().workRepGained)) / (ns.getPlayer().workRepGainRate * 5)) * 1000, false) : "unknown")}`)
        if (!ns.singularity.isBusy()) {
            logging.info(`improving relationship with ${faction}`);
            ns.singularity.workForFaction(faction, "hacking", true);
        }
        if (!ns.singularity.isFocused() && needToFocus(ns)) {
            // TODO
            // logging.info(`focusing on work. ${ns.getPlayer().currentWorkFactionName}`)
            ns.singularity.setFocus(true);
        }
        await ns.asleep(1000 * 60);
    }
    ns.singularity.stopAction();
};

export const improveStat = async function (
    ns: NS,
    logging: Logging,
    hacking = 0,
    combat = 0,
    charisma = 0,
): Promise<void> {
    let previousSkill = "";
    // eslint-disable-next-line no-constant-condition
    while (true) {
        await ns.asleep(1000);
        const player = ns.getPlayer();
        let skill = "";

        if (player.skills.agility < combat) skill = "agility";
        else if (player.skills.strength < combat) skill = "strength";
        else if (player.skills.defense < combat) skill = "defense";
        else if (player.skills.dexterity < combat) skill = "dexterity";
        else if (player.skills.charisma < charisma) skill = "charisma";
        else if (player.skills.hacking < hacking) skill = "hacking";

        if (skill === "") {
            ns.singularity.stopAction();
            break;
        }

        if (previousSkill !== skill || !ns.singularity.isBusy()) {
            previousSkill = skill;
            if (player.location.toLowerCase() !== "sector-12") {
                ns.singularity.travelToCity(ns.enums.CityName.Sector12);
            }
            if (
                ["agility", "strength", "defense", "dexterity"].indexOf(skill) !== -1
            ) {
                ns.singularity.gymWorkout("powerhouse gym", skill);
                logging.info(`Working on ${skill} at powerhouse gym`);
            } else if (skill === "charisma") {
                ns.singularity.universityCourse("rothman university", "leadership");
                logging.info(`Working on ${skill} at rothman university`);
            } else if (skill === "hacking") {
                ns.singularity.universityCourse("rothman university", "algorithms");
                logging.info(`Working on ${skill} at rothman university`);
            }
        }
    }
};


