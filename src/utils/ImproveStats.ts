import { NS } from '@ns'
import { initLogging, logging } from '/shared/logging';
import { improveStat } from 'shared/factions'

export const improveCombatStatsPath ="/utils/improveCombatStats.js";


export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    ns.disableLog('ALL')
    const args = ns.flags([["combat",0],["charisma",0],["hacking",0]])
    const hacking = args.hacking
    const charisma = args.charisma
    const combat = args.combat
   await improveStat(ns, hacking,combat,charisma)
}