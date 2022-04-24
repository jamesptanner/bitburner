import { NS } from '@ns';
import { improveStat } from 'shared/factions';
import { initLogging } from '/shared/logging';

export const improveCombatStatsPath ="/utils/improveCombatStats.js";


export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    ns.disableLog('ALL')
    const args = ns.flags([["combat",0],["charisma",0],["hacking",0],["all",0]])
    const hacking = args.hacking
    const charisma = args.charisma
    const combat = args.combat
    const all = args.all
   await improveStat(ns, Math.max(all,hacking),Math.max(all,combat),Math.max(all,charisma))
}