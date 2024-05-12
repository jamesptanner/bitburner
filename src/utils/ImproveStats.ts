import { NS } from "@ns";
import { hasSignularity, trainSkill } from "/shared/singularity";
import { Game } from "/lib/game";

export const improveCombatStatsPath = "/utils/improveCombatStats.js";

export async function main(ns: NS): Promise<void> {
  const game = new Game(ns)
  await game.logging.initLogging();
  ns.disableLog("ALL");
  
  if (!hasSignularity(game)) return;
  const args = ns.flags([
    ["combat", 0],
    ["charisma", 0],
    ["hacking", 0],
    ["all", 0],
  ]);

  const all = args.all as number;
  const hacking = Math.max(all, args.hacking as number);
  const charisma = Math.max(all, args.charisma as number);
  const combat = Math.max(all, args.combat as number);

  await trainSkill(game,"hacking",hacking)
  await trainSkill(game,"agility",combat)
  await trainSkill(game,"defense",combat)
  await trainSkill(game,"dexterity",combat)
  await trainSkill(game,"strength",combat)
  await trainSkill(game,"charisma",charisma)
}
