var Level;
(function (Level) {
    Level[Level["Error"] = 0] = "Error";
    Level[Level["Warning"] = 1] = "Warning";
    Level[Level["Info"] = 2] = "Info";
    Level[Level["success"] = 3] = "success";
})(Level || (Level = {}));
//from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid.
//cant import crypto so this should do.
//TODO keep an eye out for something better.
function generateUUID() {
    let d = new Date().getTime(); //Timestamp
    let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16; //random number between 0 and 16
        if (d > 0) { //Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        }
        else { //Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
generateUUID();
const log = function (level, msg, toast) {
    {
        throw new Error("Logging not initalised");
    }
};
const success = function (msg, toast) {
    log();
};
const info = function (msg, toast) {
    log();
};
const warning = function (msg, toast) {
    log();
};
const error = function (msg, toast) {
    log();
};
const logging = {
    log: log,
    error: error,
    warning: warning,
    success: success,
    info: info
};

const factions = [
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
const factionUnlockRequirements = new Map([
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
            corp: "Fulcrum Technologies",
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
]);
const getAvailableFactions = function (ns) {
    const player = ns.getPlayer();
    return factions.filter(faction => {
        return player.factions.indexOf(faction) != -1 ||
            ns.singularity.checkFactionInvitations().indexOf(faction) != -1;
    });
};
const waitToBackdoor = async function (ns, server) {
    logging.info(`Waiting for ${server} to be backdoored`);
    while (!ns.getServer(server).backdoorInstalled) {
        if (ns.getPlayer().workType !== "Studying or Taking a class at university") {
            logging.info(`improving hacking skills at uni`);
            //improve hacking skill
            if (!ns.getPlayer().isWorking) {
                if (ns.singularity.travelToCity('Volhaven')) {
                    ns.singularity.universityCourse("ZB Institute of Technology", "Algorithms");
                }
            }
        }
        await ns.sleep(60 * 1000);
    }
    if (ns.getPlayer().workType === "Studying or Taking a class at university") {
        ns.singularity.stopAction();
    }
};
const repForNextRole = function (ns, corpName) {
    const jobs = ns.getPlayer().jobs;
    // typedef is incorrect for deprecated charInfo.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore 
    switch (jobs[corpName]) {
        case "IT Intern":
            return 7e3;
        case "Software Engineering Intern":
        case "Business Intern":
            return 8e3;
        case "IT Analyst":
            return 35e3;
        case "Junior Software Engineer":
        case "Business Analyst":
            return 40e3;
        case "IT Manager":
            return 175e3;
        case "Senior Software Engineer":
            return 200e3;
        case "Lead Software Developer":
            return 400e3;
        case "Systems Administrator":
        case "Head of Software":
            return 800e3;
        case "Head of Engineering":
            return 1.6e6;
        case "Vice President of Technology":
            return 3.2e6;
    }
    return Infinity;
};
const improveCorporateReputation = async function (ns, corpName, reputation) {
    logging.info(`Waiting to improve reputation with ${corpName}`);
    while (ns.singularity.getCompanyRep(corpName) < reputation) {
        ns.singularity.applyToCompany(corpName, "software");
        ns.singularity.workForCompany(corpName);
        const currentRep = ns.singularity.getCompanyRep(corpName);
        while (currentRep + (ns.getPlayer().workRepGained / 2) < reputation) {
            if (currentRep + (ns.getPlayer().workRepGained / 2) > repForNextRole(ns, corpName)) {
                ns.singularity.stopAction();
                break;
            }
            await ns.sleep(60 * 1000);
            if (!ns.singularity.isBusy()) {
                ns.singularity.workForCompany(corpName);
            }
            const repNeeded = ((reputation - currentRep) * 2) - ns.getPlayer().workRepGained;
            logging.info(`RepNeeded: ${ns.nFormat(repNeeded, "(0.000)")}, repGain: ${ns.nFormat(ns.getPlayer().workRepGainRate * 5, "(0.000)")}`);
            logging.info(`estimated time remaining: ${ns.tFormat(repNeeded * 1000 / (ns.getPlayer().workRepGainRate * 5))}`);
        }
        ns.singularity.stopAction();
    }
};
const unlockFaction = async function (ns, faction) {
    if (ns.getPlayer().factions.indexOf(faction) !== -1)
        return true;
    if (getAvailableFactions(ns).indexOf(faction) !== -1) {
        ns.singularity.joinFaction(faction);
        return true;
    }
    //need to put the work in to unlock the faction. 
    const requirements = factionUnlockRequirements.get(faction);
    if (!requirements)
        return false;
    while (ns.getPlayer().factions.indexOf(faction) === -1) {
        await ns.sleep(100);
        if (requirements.augments) {
            if (requirements.augments > ns.singularity.getOwnedAugmentations(false).length) {
                logging.info(`Not enough augments installed ${ns.singularity.getOwnedAugmentations(false)}/${requirements.augments}`);
                return false;
            }
        }
        if (requirements.location && ns.getPlayer().location !== requirements.location) {
            ns.singularity.travelToCity(requirements.location);
        }
        if (requirements.cash && ns.getPlayer().money < requirements.cash) {
            await ns.sleep(1000 * 60);
        }
        if (requirements.combatSkill) {
            await improveStat(ns, 0, requirements.combatSkill);
        }
        if (requirements.hacking) {
            await improveStat(ns, requirements.hacking);
        }
        if (typeof requirements.corp == 'string' && typeof requirements.corpRep == 'number') {
            await improveCorporateReputation(ns, requirements.corp, requirements.corpRep);
        }
        if (requirements.hackingLevels || requirements.hackingRAM || requirements.hackingCPU) {
            // await hacknetBuyAtLeast(ns,requirements.hackingLevels, requirements.hackingRAM, requirements.hackingCPU)
            return false;
        }
        if (requirements.karma) {
            // await workOnKarma(ns,requirements.karma)
            return false;
        }
        if (requirements.backdoor) {
            await waitToBackdoor(ns, requirements.backdoor);
        }
        ns.singularity.joinFaction(faction);
    }
    return true;
};
const improveStat = async function (ns, hacking = 0, combat = 0, charisma = 0) {
    let previousSkill = "";
    while (true) {
        await ns.sleep(1000);
        const player = ns.getPlayer();
        let skill = "";
        if (player.agility < combat)
            skill = 'agility';
        else if (player.strength < combat)
            skill = 'strength';
        else if (player.defense < combat)
            skill = 'defense';
        else if (player.dexterity < combat)
            skill = 'dexterity';
        else if (player.charisma < charisma)
            skill = 'charisma';
        else if (player.hacking < hacking)
            skill = 'hacking';
        if (skill === "") {
            ns.singularity.stopAction();
            break;
        }
        if (previousSkill !== skill || !ns.singularity.isBusy()) {
            previousSkill = skill;
            if (player.location.toLowerCase() !== "sector-12") {
                ns.singularity.goToLocation("sector-12");
            }
            ns.clearLog();
            if (['agility', 'strength', 'defense', 'dexterity'].indexOf(skill) !== -1) {
                ns.singularity.gymWorkout("powerhouse gym", skill);
                logging.info(`Working on ${skill} at powerhouse gym`);
            }
            else if (skill === 'charisma') {
                ns.singularity.universityCourse('rothman university', "leadership");
                logging.info(`Working on ${skill} at rothman university`);
            }
            else if (skill === 'hacking') {
                ns.singularity.universityCourse('rothman university', "algorithms");
                logging.info(`Working on ${skill} at rothman university`);
            }
        }
    }
};

const UnlockCompaniesPath = "/utils/UnlockCompanies.js";
const companies = [
    "ECorp",
    "MegaCorp",
    "KuaiGong International",
    "Four Sigma",
    "NWO",
    "Blade Industries",
    "OmniTek Incorporated",
    "Bachman & Associates",
    "Clarke Incorporated",
    "Fulcrum Secret Technologies"
];
async function main(ns) {
    ns.disableLog("ALL");
    for (const company of companies) {
        await unlockFaction(ns, company);
    }
}

export { UnlockCompaniesPath, main };