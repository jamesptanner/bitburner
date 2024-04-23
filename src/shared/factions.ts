import { NS } from "@ns";
import { Logging } from "shared/logging";
import { needToFocus } from "shared/utils";
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