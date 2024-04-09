import { NS } from "@ns";
import { factions, getAllAugmentsFromFaction } from "/shared/factions";

import { makeTable } from "/shared/ui";
import { unique } from "/shared/utils";
import { Logging } from "/shared/logging";

export const dumpAllAugmentsPath = "/augments/dumpAllAugments.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();

  ns.clearLog();
  ns.tail();
  const augments: string[] = ns.singularity.getOwnedAugmentations(true);
  factions.forEach((faction) => {
    augments.push(...getAllAugmentsFromFaction(ns, faction));
  });

  const flags = ns.flags([
    ["player", false],
    ["hacking", false],
    ["faction", false],
    ["hacknet", false],
    ["bladeburner", false],
    ["all", false],
  ]);

  const NToS = function (val?: number): string {
    if (val === undefined) return "-";
    return ns.formatNumber(val);
  };
  const augmentData = augments
    .filter(unique)
    .sort()
    .map((augment) => {
      const augmentInfo = ns.singularity.getAugmentationStats(augment);
      const player = [
        NToS(augmentInfo.hacking),
        NToS(augmentInfo.strength),
        NToS(augmentInfo.defense),
        NToS(augmentInfo.dexterity),
        NToS(augmentInfo.agility),
        NToS(augmentInfo.charisma),
        NToS(augmentInfo.hacking_exp),
        NToS(augmentInfo.strength_exp),
        NToS(augmentInfo.defense_exp),
        NToS(augmentInfo.dexterity_exp),
        NToS(augmentInfo.agility_exp),
        NToS(augmentInfo.charisma_exp),
      ];
      const hacking = [
        NToS(augmentInfo.hacking_chance),
        NToS(augmentInfo.hacking_speed),
        NToS(augmentInfo.hacking_money),
        NToS(augmentInfo.hacking_grow),
      ];
      const faction = [
        NToS(augmentInfo.company_rep),
        NToS(augmentInfo.faction_rep),
        NToS(augmentInfo.crime_money),
        NToS(augmentInfo.crime_success),
        NToS(augmentInfo.work_money),
      ];
      const hacknet = [
        NToS(augmentInfo.hacknet_node_money),
        NToS(augmentInfo.hacknet_node_purchase_cost),
        NToS(augmentInfo.hacknet_node_ram_cost),
        NToS(augmentInfo.hacknet_node_core_cost),
        NToS(augmentInfo.hacknet_node_level_cost),
      ];
      const bladeburner = [
        NToS(augmentInfo.bladeburner_max_stamina),
        NToS(augmentInfo.bladeburner_stamina_gain),
        NToS(augmentInfo.bladeburner_analysis),
        NToS(augmentInfo.bladeburner_success_chance),
      ];

      return [player, hacking, faction, hacknet, bladeburner];
    });
  const defaultData = augments
    .filter(unique)
    .sort()
    .map((augment) => {
      return [
        augment,
        `$${ns.formatNumber(ns.singularity.getAugmentationPrice(augment))}`,
      ];
    });
  const defaultHeaders = ["augment", "price"];
  const playerHeaders = [
    "hack",
    "str",
    "def",
    "dex",
    "agi",
    "cha",
    "hack xp",
    "str xp",
    "def xp",
    "dex xp",
    "agi xp",
    "cha xp",
  ];
  const hackingHeaders = [
    "hack chance",
    "hack speed",
    "hack money",
    "hack growth",
  ];
  const factionHeaders = [
    "comp rep",
    "fact rep",
    "crime mon",
    "crime success",
    "work mon",
  ];
  const hacknetHeaders = [
    "hacknet node mon",
    "hacknet node cost",
    "hacknet ram cost",
    "hacknet core cost",
    "hacknet level cost",
  ];
  const bladeburnerHeaders = [
    "bladeburner stamina",
    "bladeburner stamina gain",
    "bladeburner analysis",
    "bladeburner success",
  ];

  const playerInfo = augmentData.map((ad) => {
    return ad[0];
  });
  const hackingInfo = augmentData.map((ad) => {
    return ad[1];
  });
  const factionInfo = augmentData.map((ad) => {
    return ad[2];
  });
  const hacknetInfo = augmentData.map((ad) => {
    return ad[3];
  });
  const bladeburnerInfo = augmentData.map((ad) => {
    return ad[4];
  });

  const tableHeaders = defaultHeaders;
  const tableData = defaultData;
  if (flags.player || flags.all) {
    tableHeaders.push(...playerHeaders);
    tableData.forEach((v, i) => {
      v.push(...playerInfo[i]);
    });
  }

  if (flags.hacking || flags.all) {
    tableHeaders.push(...hackingHeaders);
    tableData.forEach((v, i) => {
      v.push(...hackingInfo[i]);
    });
  }

  if (flags.faction || flags.all) {
    tableHeaders.push(...factionHeaders);
    tableData.forEach((v, i) => {
      v.push(...factionInfo[i]);
    });
  }

  if (flags.hacknet || flags.all) {
    tableHeaders.push(...hacknetHeaders);
    tableData.forEach((v, i) => {
      v.push(...hacknetInfo[i]);
    });
  }

  if (flags.bladeburner || flags.all) {
    tableHeaders.push(...bladeburnerHeaders);
    tableData.forEach((v, i) => {
      v.push(...bladeburnerInfo[i]);
    });
  }
  const filteredData =
    flags.all ||
    flags.player ||
    flags.hacking ||
    flags.faction ||
    flags.hacknet ||
    flags.bladeburner
      ? tableData.filter((val) => {
          return !val.every((v, i) => {
            return i === 0 || i === 1 || v === "-";
          });
        })
      : tableData;
  logging.info(makeTable(ns, tableHeaders, filteredData, 1));
}
