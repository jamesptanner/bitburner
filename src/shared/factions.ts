import { CompanyName, NS, PlayerRequirement, Skills, MoneyRequirement, SkillRequirement, KarmaRequiremennt, PeopleKilledRequirement, FileRequirement, NumAugmentationsRequirement, EmployedByRequirement, CompanyReputationRequirement, JobTitleRequirement, CityRequirement, LocationRequirement, BackdoorRequirement, HacknetRAMRequirement, HacknetCoresRequirement, HacknetLevelsRequirement, BitNodeRequirement, SourceFileRequirement, BladeburnerRankRequirement, NumInfiltrationsRequirement, NotRequirement, SomeRequirement, EveryRequirement, CityName, GymType } from "@ns";
import { Logging } from "shared/logging";
import { needToFocus } from "shared/utils";
import { checkCostsPath } from "/servers/checkCosts";
import { UniversityClassType } from "/lib/nsenums";
import { buyScriptsPath } from "/cron/buyScripts";
import { ProcessRequirementsResult, processRequirements } from "/shared/factionRequirementProcessor";

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
    const postitionInfo = ns.singularity.getCompanyPositionInfo(corpName as keyof typeof jobs, (jobs[corpName as keyof typeof jobs])!)
    return postitionInfo.nextPosition !== null ? ns.singularity.getCompanyPositionInfo(corpName as keyof typeof jobs, postitionInfo.nextPosition).requiredReputation : Infinity;
};


async function aquireSkills(ns: NS, logging: Logging, requiredSkills: Skills) {
    await improveStat(ns, logging, requiredSkills.hacking, Math.max(requiredSkills.agility, requiredSkills.defense, requiredSkills.dexterity, requiredSkills.strength), requiredSkills.charisma);
}

const unlockNextRole = async function (ns: NS, corpName: CompanyName, logging: Logging) {
    const currentJob = ns.getPlayer().jobs[corpName];
    if (currentJob) {
        const posInfo = ns.singularity.getCompanyPositionInfo(corpName, currentJob);
        const nextJob = posInfo.nextPosition;
        if (nextJob) {
            await aquireSkills(ns, logging, ns.singularity.getCompanyPositionInfo(corpName, nextJob).requiredSkills)
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
                await unlockNextRole(ns, corpName, logging);
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

const workOnKarma = async function (ns: NS, karamLevel: number) {

    if (ns.getPlayer().karma <= karamLevel) return;
    while (ns.getPlayer().karma > karamLevel) {
        const timeToWait = ns.singularity.commitCrime("Homicide");
        await ns.asleep(timeToWait);
    }
}

const hacknetHasAtLeast = async function (ns: NS, hackingLevels: number, hackingRAM: number, hackingCPU: number) {
    while (true) {
        const totalNodes = ns.hacknet.numNodes();
        for (let nodeId = 0; nodeId < totalNodes; nodeId++) {
            const element = ns.hacknet.getNodeStats(nodeId);
            if (element.level >= hackingLevels && element.ram >= hackingRAM && element.cores >= hackingCPU) return;
        }
        await ns.asleep(60000)
    }

}

export const unlockFaction = async function (
    ns: NS,
    logging: Logging,
    faction: string,
): Promise<boolean> {
    if (ns.getPlayer().factions.indexOf(faction) !== -1) return true;
    if (getAvailableFactions(ns).indexOf(faction) !== -1) {
        ns.singularity.joinFaction(faction);
        return true;
    }

    //need to put the work in to unlock the faction.
    const requirements = ns.singularity.getFactionInviteRequirements(faction)
    logging.info(`Requirments: ${JSON.stringify(requirements)}`)
    if (!requirements) return false;

    factionLoop: while (ns.getPlayer().factions.indexOf(faction) === -1) {
        await ns.asleep(100);
        logging.info(`attempting to unlock ${faction} faction. `)
        const factionState = await processRequirements(ns, logging, requirements);
        switch (factionState) {
            case ProcessRequirementsResult.Forfilled:
                logging.info(`Completed unlocking ${faction}`);
                break;
            case ProcessRequirementsResult.Possible:
                logging.info(`Did not complete unlocking ${faction}`);
                break;
            case ProcessRequirementsResult.Impossible:
                logging.info(`Not possible to unlock ${faction}`);
                break factionLoop;
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