import { NS } from "@ns";
import { factions } from "shared/factions";
import { getAugmentsAvailableFromFaction } from "/shared/factions";

import { makeTable } from "/shared/ui";
import { Logging } from "/shared/logging";

export const listAugmentsPath = "/utils/listAugments.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();

  ns.clearLog();
  ns.tail();

  logging.info(`Getting list of augments`);

  const playerInFaction = (faction: string): boolean => {
    return ns.getPlayer().factions.indexOf(faction) !== -1;
  };
  factions.forEach((faction) => {
    const augments = getAugmentsAvailableFromFaction(ns, faction);
    if (augments.length > 0) {
      const headers = ["augment", "reputation", "price"];
      const data = augments.map((aug) => {
        return [
          aug,
          `${ns.formatNumber(ns.singularity.getAugmentationRepReq(aug))}`,
          `$${ns.formatNumber(ns.singularity.getAugmentationPrice(aug), 2)}`,
        ];
      });
      logging.info(
        `${faction}: ${playerInFaction(faction) ? ns.formatNumber(ns.singularity.getFactionRep(faction)) : "Locked"}`,
      );
      logging.info(makeTable(ns, headers, data, 1));
    }
  });
}
