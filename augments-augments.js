const needToFocus = function (ns) {
    if (ns.singularity.getOwnedAugmentations(false).indexOf("Neuroreceptor Management Implant") !== -1)
        return false;
    return true;
};

var Level;
(function (Level) {
    Level[Level["Error"] = 0] = "Error";
    Level[Level["Warning"] = 1] = "Warning";
    Level[Level["Info"] = 2] = "Info";
    Level[Level["success"] = 3] = "success";
})(Level || (Level = {}));
class LoggingPayload {
    host;
    script;
    trace;
    timestamp;
    payload;
    constructor(host, script, trace, payload) {
        if (host)
            this.host = host;
        if (script)
            this.script = script;
        if (trace)
            this.trace = trace;
        if (payload)
            this.payload = payload;
        this.timestamp = (performance.now() + performance.timeOrigin) * 1000000;
    }
    static fromJSON(d) {
        return Object.assign(new LoggingPayload(), JSON.parse(d));
    }
}
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
const loggingTrace = generateUUID();
let n;
const LoggingTable = "logging";
let loggingDB;
const levelToString = function (level) {
    switch (level) {
        case Level.Error:
            return "ERROR";
        case Level.Info:
            return "INFO";
        case Level.Warning:
            return "WARNING";
        case Level.success:
            return "SUCCESS";
    }
    return "";
};
const levelToToast = function (level) {
    switch (level) {
        case Level.Error:
            return "error";
        case Level.Info:
            return "info";
        case Level.Warning:
            return "warning";
        case Level.success:
            return "success";
    }
    return undefined;
};
const log = function (level, msg, toast) {
    if (toast) {
        n.toast(`${levelToString(level)}: ${msg}`, levelToToast(level));
    }
    n.print(`${levelToString(level)}: ${msg}`);
    const logPayload = new LoggingPayload(n.getHostname(), n.getScriptName(), loggingTrace, {
        level: level,
        message: msg,
    });
    const tx = loggingDB.transaction(LoggingTable, 'readwrite');
    void tx.store.add(logPayload);
};
const success = function (msg, toast) {
    log(Level.success, msg, toast);
};
const info = function (msg, toast) {
    log(Level.Info, msg, toast);
};
const warning = function (msg, toast) {
    log(Level.Warning, msg, toast);
};
const error = function (msg, toast) {
    log(Level.Error, msg, toast);
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
]);
const getAvailableFactions = function (ns) {
    const player = ns.getPlayer();
    return factions.filter(faction => {
        return player.factions.indexOf(faction) != -1 ||
            ns.singularity.checkFactionInvitations().indexOf(faction) != -1;
    });
};
const getAugmentsAvailableFromFaction = function (ns, faction) {
    return ns.singularity.getAugmentationsFromFaction(faction).filter(augment => {
        return ns.singularity.getOwnedAugmentations(true).indexOf(augment) == -1;
    });
};
const getUniqueAugmentsAvailableFromFaction = function (ns, faction) {
    return getAugmentsAvailableFromFaction(ns, faction).filter(augment => {
        return augment !== "NeuroFlux Governor";
    });
};
const waitToBackdoor = async function (ns, server) {
    ns.printf(`Waiting for ${server} to be backdoored`);
    while (!ns.getServer(server).backdoorInstalled) {
        if (ns.getPlayer().workType !== "Studying or Taking a class at university") {
            ns.printf(`improving hacking skills at uni`);
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
    switch (jobs.get(corpName)) {
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
    ns.printf(`Waiting to impove reputation with ${corpName}`);
    while (ns.singularity.getCompanyRep(corpName) < reputation) {
        ns.singularity.applyToCompany(corpName, "software");
        ns.singularity.workForCompany(corpName);
        const currentRep = ns.singularity.getCompanyRep(corpName);
        while (currentRep + (ns.getPlayer().workRepGained * 2) < reputation ||
            currentRep + (ns.getPlayer().workRepGained * 2) < repForNextRole(ns, corpName)) {
            await ns.sleep(60 * 1000);
            if (!ns.singularity.isBusy()) {
                ns.singularity.workForCompany(corpName);
            }
            const repNeeded = ((reputation - currentRep) * 2) - ns.getPlayer().workRepGained;
            ns.printf(`INFO:RepNeeded: ${repNeeded}, repGain: ${ns.getPlayer().workRepGainRate * 5}`);
            ns.printf(`INFO:estimated time remaining: ${ns.tFormat(repNeeded * 1000 / (ns.getPlayer().workRepGainRate * 5))}`);
        }
        ns.singularity.stopAction();
    }
};
const unlockFaction = async function (ns, faction) {
    if (ns.getPlayer().factions.indexOf(faction) !== -1)
        return true;
    if (getAvailableFactions(ns).indexOf(faction) !== -1) {
        return true;
    }
    //need to put the work in to unlock the faction. 
    const requirements = factionUnlockRequirements.get(faction);
    if (!requirements)
        return false;
    while (ns.getPlayer().factions.indexOf(faction) === -1) {
        if (requirements.augments) {
            if (requirements.augments > ns.singularity.getOwnedAugmentations(false).length) {
                ns.printf(`Not enough augments installed ${ns.singularity.getOwnedAugmentations(false)}/${requirements.augments}`);
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
            await improveStat(ns, 0, requirements.hacking);
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
const improveFactionReputation = async function (ns, faction, reputation) {
    while (reputation > ns.singularity.getFactionRep(faction) + (ns.getPlayer().currentWorkFactionName === faction ? ns.getPlayer().workRepGained : 0)) {
        ns.tail();
        ns.printf(`INFO: current faction relationship ${faction} is ${ns.nFormat(ns.singularity.getFactionRep(faction) + (ns.getPlayer().currentWorkFactionName === faction ? ns.getPlayer().workRepGained : 0), "0,0.000")}, want ${reputation}.`);
        ns.printf(`INFO: Time Remaining: ${(ns.getPlayer().currentWorkFactionName === faction ? ns.tFormat(((reputation - (ns.singularity.getFactionRep(faction) + ns.getPlayer().workRepGained)) / (ns.getPlayer().workRepGainRate * 5)) * 1000, false) : "unknown")}`);
        if (!ns.singularity.isBusy()) {
            ns.printf(`INFO: improving relationship with ${faction}`);
            ns.singularity.workForFaction(faction, "hacking", true);
        }
        if (!ns.singularity.isFocused() && needToFocus(ns)) {
            ns.printf(`focusing on work. ${ns.getPlayer().currentWorkFactionName}`);
            ns.singularity.setFocus(true);
        }
        await ns.sleep(1000 * 60);
    }
    ns.singularity.stopAction();
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

const augmentsPath = "/cron/augments.js";
const intersection = function (a, b) {
    return a.filter(aVal => {
        return b.indexOf(aVal) !== -1;
    });
};
const chooseAFaction = function (ns, skipFactions) {
    const factionsToComplete = factions.filter(faction => {
        return getUniqueAugmentsAvailableFromFaction(ns, faction).length != 0;
    });
    if (factionsToComplete.length == 1)
        return factionsToComplete[0];
    const factionInvites = ns.singularity.checkFactionInvitations();
    if (factionInvites.length > 0) {
        const readyNow = intersection(factionInvites, factionsToComplete);
        if (readyNow.length > 0)
            return readyNow[0];
    }
    return factionsToComplete.filter(faction => {
        if (skipFactions.indexOf(faction) !== -1)
            return false;
        const requirements = factionUnlockRequirements.get(faction);
        if (!requirements?.not)
            return true;
        if (requirements.not.faction && intersection(requirements.not.faction, ns.getPlayer().factions).length > 0)
            return false;
        if (requirements.not.employers && intersection(requirements.not.employers, ns.getPlayer().jobs).length > 0)
            return false;
        return true;
    })[0];
};
/**
 * Attempt to purchase a augmentation from a faction. If we fail to purchase 3 times after meeting the criteria then fail.
 * @param ns
 * @param faction faction to buy from
 * @param augment augment to buy
 */
const purchaseAugment = async function (ns, faction, augment) {
    ns.printf(`INFO: buying ${augment} from ${faction}`);
    let purchaseAttempt = 0;
    while (!ns.singularity.purchaseAugmentation(faction, augment) && purchaseAttempt < 3) {
        let lastMoneyCheck = ns.getPlayer().money;
        while (ns.getPlayer().money < ns.singularity.getAugmentationPrice(augment)) {
            const currentMoneyCheck = ns.getPlayer().money;
            const moneyDiff = currentMoneyCheck - lastMoneyCheck;
            ns.printf(`INFO:estimated time remaining: ${ns.tFormat((ns.singularity.getAugmentationPrice(augment) - currentMoneyCheck) / (60 * 1000 / moneyDiff))}`);
            lastMoneyCheck = currentMoneyCheck;
            await ns.sleep(1000 * 60);
        }
        purchaseAttempt++;
    }
    if (purchaseAttempt === 3 && ns.singularity.getOwnedAugmentations(true).indexOf(augment) === -1) {
        ns.printf(`ERROR: failed to buy ${augment} from ${faction}`);
    }
    ns.printf(`INFO: bought ${augment} from ${faction}`);
};
const purchaseAugments = async function (ns, faction, augments) {
    const sortedAugments = augments.sort((a, b) => {
        return ns.singularity.getAugmentationPrice(b) - ns.singularity.getAugmentationPrice(a); //prices change but the order wont.
    });
    for (const augment of sortedAugments) {
        //double check we have the reputation for the augment
        if (ns.singularity.getAugmentationRepReq(augment) < ns.singularity.getFactionRep(faction)) {
            await improveFactionReputation(ns, faction, ns.singularity.getAugmentationRepReq(augment));
        }
        if (ns.singularity.getAugmentationPrereq(augment).length > 0) { //handle the augment pre requirements first.
            ns.printf(`WARN: getting prerequisite for ${augment} first`);
            const unownedPrerequisites = ns.singularity.getAugmentationPrereq(augment)
                .filter(preReq => {
                return ns.singularity.getOwnedAugmentations(true).indexOf(preReq) === -1;
            });
            for (const preReq of unownedPrerequisites) {
                await purchaseAugments(ns, faction, [preReq]);
            }
        }
        await purchaseAugment(ns, faction, augment);
    }
};
async function main(ns) {
    ns.disableLog("ALL");
    const skippedFactions = [];
    //do we already have some factions we could buy from unlocked?
    const availableAugments = getAvailableFactions(ns)
        .map(faction => {
        const augs = getUniqueAugmentsAvailableFromFaction(ns, faction);
        if (augs.length > 0) {
            ns.print(`faction:${faction}, augments:[${augs}]`);
        }
        return augs;
    })
        .reduce((prev, augments) => {
        return prev.concat(...augments);
    }, [])
        .filter((v, i, self) => { return self.indexOf(v) === i; });
    if (availableAugments.length === 0) {
        await unlockNewFactionAndBuyAugments(ns, skippedFactions);
    }
    else {
        await buyExistingAugments(ns, availableAugments);
    }
}
async function unlockNewFactionAndBuyAugments(ns, skippedFactions) {
    let faction = chooseAFaction(ns, skippedFactions);
    let unlocked = false;
    do {
        if (ns.getPlayer().factions.indexOf(faction) === -1) {
            ns.printf(`INFO: Unlocking faction ${faction}`);
            unlocked = await unlockFaction(ns, faction);
            if (unlocked) {
                ns.singularity.joinFaction(faction);
            }
            else {
                ns.printf(`ERROR: Cant faction ${faction}`);
                skippedFactions.push(faction);
                faction = chooseAFaction(ns, skippedFactions);
            }
        }
        else {
            unlocked = true;
        }
        await ns.sleep(100);
        if (faction === undefined) {
            ns.exit();
        }
    } while (!unlocked);
    ns.printf(`INFO: buying up all augments from ${faction}`);
    const augments = getUniqueAugmentsAvailableFromFaction(ns, faction);
    ns.printf(`INFO: augments available [${augments}]`);
    const maxRepNeeded = augments.reduce((repNeeded, augment) => {
        return Math.max(repNeeded, ns.singularity.getAugmentationRepReq(augment));
    }, 0);
    if (ns.singularity.getFactionRep(faction) < maxRepNeeded) {
        ns.printf(`INFO: improving reputation with ${faction}`);
        await improveFactionReputation(ns, faction, maxRepNeeded);
    }
    await purchaseAugments(ns, faction, augments);
}
async function buyExistingAugments(ns, availableAugments) {
    //turn the augments we have available into pairs of aug/faction
    const factionForAugment = availableAugments.map(augment => {
        for (const faction of getAvailableFactions(ns)) {
            if (getAugmentsAvailableFromFaction(ns, faction).indexOf(augment) !== -1) {
                return [augment, faction];
            }
        }
        return [];
    })
        .filter(a => a.length === 2)
        .sort((a, b) => {
        if (b == null)
            return 1;
        if (a == null)
            return -1;
        return ns.singularity.getAugmentationPrice(a[0]) - ns.singularity.getAugmentationPrice(b[0]);
    })
        .reverse();
    for (const pair of factionForAugment) {
        if (pair === null)
            continue;
        const [augment, faction] = pair;
        if (ns.singularity.getAugmentationRepReq(augment) < ns.singularity.getFactionRep(faction)) {
            await improveFactionReputation(ns, faction, ns.singularity.getAugmentationRepReq(augment));
        }
        await purchaseAugments(ns, faction, [augment]);
    }
}

export { augmentsPath, main };
