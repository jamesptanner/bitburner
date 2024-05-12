import { NS } from "@ns";
import { getAugmentsAvailableFromFaction } from "shared/factions";
import { improveFactionReputation } from "shared/factions";
import { Logging } from "/shared/logging";

export const improveFactionReleationsPath =
  "/utils/improveFactionReleations.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();
  ns.disableLog("ALL");

  const opts = ns.flags([
    ["max", 0],
  ]);

  for (const faction of ns.getPlayer().factions) {
    const reputation = getAugmentsAvailableFromFaction(
      ns,
      faction,
    ).reduce<number>((prev, curr) => {
      if ((opts["max"] as number) !== 0 && ns.singularity.getAugmentationBasePrice(curr) > (opts["max"] as number)) return prev; 
      return Math.max(prev, ns.singularity.getAugmentationRepReq(curr));
    }, 0);
    await improveFactionReputation(ns, faction, reputation);
  }
}
