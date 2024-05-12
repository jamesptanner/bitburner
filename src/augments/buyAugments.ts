import { NS } from "@ns";

import { getAugmentsAvailableFromFaction } from "/shared/factions";
import { unique } from "/shared/utils";
import { makeTable } from "/shared/ui";
import { Logging, TextColors } from "/shared/logging";

export const buyAugmentsPath = "/augments/buyAugments.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();

  const opts = ns.flags([
    ["dry", false],
    ["wait", false],
    ["skip", 0],
    ["neuro", false],
  ]);

  type augInfo = {
    name: string;
    price: number;
    location: string;
    reputation: string;
  };

  const augments = ns
    .getPlayer()
    .factions.map((faction) => {
      return getAugmentsAvailableFromFaction(ns, faction);
    })
    .reduce<string[]>((prev, curr) => {
      prev.push(...curr);
      return prev;
    }, [])
    .filter(unique)
    .map<augInfo>((augment) => {

      //find best faction
      const repNeeded = ns.singularity.getAugmentationRepReq(augment)
      const bestFaction = ns.getPlayer().factions.filter((faction) => {
        return (
          getAugmentsAvailableFromFaction(ns, faction).indexOf(augment) !== -1
        );
      }).reduce((oldFaction, testFaction)=>{
        return ns.singularity.getFactionRep(oldFaction) > ns.singularity.getFactionRep(testFaction) ? oldFaction : testFaction;
      })

      return {
        name: augment,
        price: ns.singularity.getAugmentationPrice(augment),
        reputation:`${ns.singularity.getFactionRep(bestFaction)>ns.singularity.getAugmentationRepReq(augment)?TextColors.green:TextColors.red}${ns.formatNumber(repNeeded)}${TextColors.reset}`,
        location: bestFaction,
      };
    })
    .sort((a, b) => {
      return a.price - b.price;
    })
    .reverse();
  logging.info(
    makeTable(
      ns,
      ["augment", "faction","rep", "price"],
      augments.map((aug) => {
        return [aug.name, aug.location,aug.reputation, ns.formatNumber(aug.price)];
      }),
    ),
  );

  primeAugment: for (const aug of augments) {
    if ((opts.skip as number) > 0) {
      const currAugPrice = ns.singularity.getAugmentationPrice(aug.name);
      if (currAugPrice >= (opts.skip as number)) {
        logging.info(`Skipping ${aug.name}, too expensive.`);
        continue;
      }
    }
    logging.info(`Attempting to buy ${aug.name}.`);
    if (!opts.dry) {

      if (ns.singularity.getAugmentationPrereq(aug.name).length > 0) {
        for (const prerequisite of ns.singularity.getAugmentationPrereq(
          aug.name,
        )) {
          if (
            ns.singularity.getOwnedAugmentations(true).indexOf(prerequisite) !==
            -1
          ) {
            continue;
          }
          const preReqAugs = augments.filter((aug) => {
            return aug.name === prerequisite;
          });
          if (preReqAugs.length === 0) {
            logging.info(`Skipping ${aug.name}, cant find pre-requisite.`);
            continue primeAugment;
          }
          if (!(await purchaseAugment(ns, logging, preReqAugs[0], opts.wait as boolean))) {
            logging.info(`Skipping ${aug.name}, couldn't buy pre-requisite.`);
            continue primeAugment;
          }
        }
      }
      void (await purchaseAugment(ns, logging, aug, opts.wait as boolean));
    }
  }

  //keep buying neuroflux govenors until we hit the limit
  if (opts.neuro && !opts.dry) {
    logging.info("getting neuroflux govenors.");
    while (
      opts.skip === 0
        ? true
        : ns.singularity.getAugmentationPrice("NeuroFlux Governor") >
          (opts.skip as number)
    ) {
      logging.info(
        `next govener costs ${ns.formatNumber(ns.singularity.getAugmentationPrice("NeuroFlux Governor"))}`,
      );
      while (
        ns.getPlayer().money <
        ns.singularity.getAugmentationPrice("NeuroFlux Governor")
      ) {
        await ns.asleep(60000);
      }
      ns.singularity.purchaseAugmentation(
        ns.getPlayer().factions[0],
        "NeuroFlux Governor",
      );
    }
  }
}

async function purchaseAugment(
  ns: NS,
  logging: Logging,
  aug: { name: string; location: string },
  wait: boolean,
): Promise<boolean> {
  do {
    ns.setTitle(`${aug.name} ${ns.formatNumber(ns.singularity.getAugmentationPrice(aug.name))}`)
    if (ns.getPlayer().money < ns.singularity.getAugmentationPrice(aug.name)) {
      await ns.asleep(1000);
    } else {
      break;
    }
  } while (
    wait &&
    ns.singularity.getOwnedAugmentations(true).indexOf(aug.name) === -1
  );
  logging.info(`Buying ${aug.name}`);
  return ns.singularity.purchaseAugmentation(aug.location, aug.name);
}
