import { NS } from "@ns";
import { improveStat } from "shared/factions";
import { Logging } from "/shared/logging";

export const improveCombatStatsPath = "/utils/improveCombatStats.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();
  ns.disableLog("ALL");
  const args = ns.flags([
    ["combat", 0],
    ["charisma", 0],
    ["hacking", 0],
    ["all", 0],
  ]);
  const hacking = args.hacking as number;
  const charisma = args.charisma as number;
  const combat = args.combat as number;
  const all = args.all as number;
  await improveStat(
    ns,
    logging,
    Math.max(all, hacking),
    Math.max(all, combat),
    Math.max(all, charisma),
  );
}
