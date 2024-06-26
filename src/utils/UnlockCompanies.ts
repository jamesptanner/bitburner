import { NS } from "@ns";
import { unlockFaction, factions as allFactions } from "shared/factions";
import { Logging } from "/shared/logging";

export const UnlockCompaniesPath = "/utils/UnlockCompanies.js";
const earlyGameFactions = [
  "CyberSec",
  "Tian Di Hui",
  "Netburners",
  "Sector-12",
  "Chongqing",
  "New Tokyo",
  "Ishima",
  "Aevum",
  "Volhaven",
  "NiteSec"
];

const crimeFactions = [
  "Slum Snakes",
  "Tetrads",
  "Silhouette",
  "Speakers for the Dead",
  "The Dark Army",
  "The Syndicate",
];
const corporateFactions = [
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
];
export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();
  ns.tail();
  const opts = ns.flags([
    ["crime", false],
    ["early", false],
    ["corp", false],
    ["all", false], 
  ]);

  const factions:string[] = [];
  if(opts.all){
    factions.push(...allFactions);
  }
  else{
    if (opts.early) {
      factions.push(...earlyGameFactions);
    }
    if (opts.corp) {
      factions.push(...corporateFactions);
    }
    if (opts.crime) {
      factions.push(...crimeFactions);
    }
  }
 
  const unlockedFactions = ns.getPlayer().factions ?? [];

  logging.info(`unlocking ${factions.join(", ")}`);
  for (const faction of factions.filter(faction =>{
    return !unlockedFactions.some(unlocked => faction === unlocked);
  })) {
    await unlockFaction(ns,logging, faction);
  }
}
