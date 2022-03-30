const needToFocus = function (ns) {
    if (ns.getOwnedAugmentations(false).indexOf("Neuroreceptor Management Implant") !== -1)
        return false;
    return true;
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
            ns.checkFactionInvitations().indexOf(faction) != -1;
    });
};
const getAugmentsAvailableFromFaction = function (ns, faction) {
    return ns.getAugmentationsFromFaction(faction).filter(augment => {
        return ns.getOwnedAugmentations(true).indexOf(augment) == -1;
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
                if (ns.travelToCity('Volhaven')) {
                    ns.universityCourse("ZB Institute of Technology", "Algorithms");
                }
            }
        }
        await ns.sleep(60 * 1000);
    }
    if (ns.getPlayer().workType === "Studying or Taking a class at university") {
        ns.stopAction();
    }
};
const repForNextRole = function (ns, corpName) {
    const charInfo = ns.getCharacterInformation();
    // typedef is incorrect for deprecated charInfo.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore 
    switch (charInfo.jobTitles[charInfo.jobs.indexOf(corpName)]) {
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
    while (ns.getCompanyRep(corpName) < reputation) {
        ns.applyToCompany(corpName, "software");
        ns.workForCompany(corpName);
        const currentRep = ns.getCompanyRep(corpName);
        while (currentRep + (ns.getPlayer().workRepGained * 2) < reputation ||
            currentRep + (ns.getPlayer().workRepGained * 2) < repForNextRole(ns, corpName)) {
            await ns.sleep(60 * 1000);
            if (!ns.isBusy()) {
                ns.workForCompany(corpName);
            }
            const repNeeded = ((reputation - currentRep) * 2) - ns.getPlayer().workRepGained;
            ns.printf(`INFO:RepNeeded: ${repNeeded}, repGain: ${ns.getPlayer().workRepGainRate * 5}`);
            ns.printf(`INFO:estimated time remaining: ${ns.tFormat(repNeeded * 1000 / (ns.getPlayer().workRepGainRate * 5))}`);
        }
        ns.stopAction();
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
            if (requirements.augments > ns.getOwnedAugmentations(false).length) {
                ns.printf(`Not enough augments installed ${ns.getOwnedAugmentations(false)}/${requirements.augments}`);
                return false;
            }
        }
        if (requirements.location && ns.getPlayer().location !== requirements.location) {
            ns.travelToCity(requirements.location);
        }
        if (requirements.cash && ns.getPlayer().money < requirements.cash) {
            await ns.sleep(1000 * 60);
        }
        if (requirements.combatSkill) {
            // await improveCombatSkills(ns,requirements.combatSkill)
            return false;
        }
        if (requirements.hacking) {
            // await improveHackingSkill(ns,requirements.hacking)
            return false;
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
        ns.joinFaction(faction);
    }
    return true;
};
const improveFactionReputation = async function (ns, faction, reputation) {
    while (reputation > ns.getFactionRep(faction) + (ns.getPlayer().currentWorkFactionName === faction ? ns.getPlayer().workRepGained : 0)) {
        ns.tail();
        ns.printf(`INFO: current faction relationship ${faction} is ${ns.nFormat(ns.getFactionRep(faction) + (ns.getPlayer().currentWorkFactionName === faction ? ns.getPlayer().workRepGained : 0), "0,0.000")}, want ${reputation}.`);
        ns.printf(`INFO: Time Remaining: ${(ns.getPlayer().currentWorkFactionName === faction ? ns.tFormat(((reputation - (ns.getFactionRep(faction) + ns.getPlayer().workRepGained)) / (ns.getPlayer().workRepGainRate * 5)) * 1000, false) : "unknown")}`);
        if (!ns.isBusy()) {
            ns.printf(`INFO: improving relationship with ${faction}`);
            ns.workForFaction(faction, "hacking", true);
        }
        if (!ns.isFocused() && needToFocus(ns)) {
            ns.printf(`focusing on work. ${ns.getPlayer().currentWorkFactionName}`);
            ns.setFocus(true);
        }
        await ns.sleep(1000 * 60);
    }
    ns.stopAction();
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
    const factionInvites = ns.checkFactionInvitations();
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
    while (!ns.purchaseAugmentation(faction, augment) && purchaseAttempt < 3) {
        let lastMoneyCheck = ns.getPlayer().money;
        while (ns.getPlayer().money < ns.getAugmentationPrice(augment)) {
            const currentMoneyCheck = ns.getPlayer().money;
            const moneyDiff = currentMoneyCheck - lastMoneyCheck;
            ns.printf(`INFO:estimated time remaining: ${ns.tFormat((ns.getAugmentationPrice(augment) - currentMoneyCheck) / (60 * 1000 / moneyDiff))}`);
            lastMoneyCheck = currentMoneyCheck;
            await ns.sleep(1000 * 60);
        }
        purchaseAttempt++;
    }
    if (purchaseAttempt === 3 && ns.getOwnedAugmentations(true).indexOf(augment) === -1) {
        ns.printf(`ERROR: failed to buy ${augment} from ${faction}`);
    }
    ns.printf(`INFO: bought ${augment} from ${faction}`);
};
const purchaseAugments = async function (ns, faction, augments) {
    const sortedAugments = augments.sort((a, b) => {
        return ns.getAugmentationPrice(b) - ns.getAugmentationPrice(a); //prices change but the order wont.
    });
    for (const augment of sortedAugments) {
        //double check we have the reputation for the augment
        if (ns.getAugmentationRepReq(augment) < ns.getFactionRep(faction)) {
            await improveFactionReputation(ns, faction, ns.getAugmentationRepReq(augment));
        }
        if (ns.getAugmentationPrereq(augment).length > 0) { //handle the augment pre requirements first.
            ns.printf(`WARN: getting prerequisite for ${augment} first`);
            const unownedPrerequisites = ns.getAugmentationPrereq(augment)
                .filter(preReq => {
                return ns.getOwnedAugmentations(true).indexOf(preReq) === -1;
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
                ns.joinFaction(faction);
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
        return Math.max(repNeeded, ns.getAugmentationRepReq(augment));
    }, 0);
    if (ns.getFactionRep(faction) < maxRepNeeded) {
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
        return ns.getAugmentationPrice(a[0]) - ns.getAugmentationPrice(b[0]);
    })
        .reverse();
    for (const pair of factionForAugment) {
        if (pair === null)
            continue;
        const [augment, faction] = pair;
        if (ns.getAugmentationRepReq(augment) < ns.getFactionRep(faction)) {
            await improveFactionReputation(ns, faction, ns.getAugmentationRepReq(augment));
        }
        await purchaseAugments(ns, faction, [augment]);
    }
}

export { augmentsPath, main };
