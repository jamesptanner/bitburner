import { NS } from '@ns';
import { unlockFaction } from 'shared/factions';
import { initLogging,logging } from '/shared/logging';

export const UnlockCompaniesPath ="/utils/UnlockCompanies.js";
const earlyGameFactions = [
    "CyberSec",
    "Tian Di Hui",
    "Netburners"
]

const crimeFactions = [
    "Slum Snakes",
    "Tetrads",
    "Silhouette",
    "Speakers for the Dead",
    "The Dark Army",
    "The Syndicate"
]
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
    "Fulcrum Secret Technologies"
]
export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    ns.tail()
    const opts = ns.flags([["crime", false],["early",false],["corp",false]])

    const factions = []
    if(opts.early){
        factions.push(...earlyGameFactions)
    }
    if(opts.corp){
        factions.push(...corporateFactions)
    }
    if(opts.crime){
        factions.push(...crimeFactions)
    }
    logging.info(`unlocking ${factions.join(", ")}`)
    for (const faction of factions){
        await unlockFaction(ns,faction)
    }
}