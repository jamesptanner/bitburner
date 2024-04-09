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
  for (const faction of ns.getPlayer().factions) {
    const reputation = getAugmentsAvailableFromFaction(
      ns,
      faction,
    ).reduce<number>((prev, curr) => {
      return Math.max(prev, ns.singularity.getAugmentationRepReq(curr));
    }, 0);
    await improveFactionReputation(ns, faction, reputation);
  }
}
