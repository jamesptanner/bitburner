import { NS } from '@ns'
import { unlockFaction } from 'shared/factions';

export const UnlockCompaniesPath ="/utils/UnlockCompanies.js";
const companies = [
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
    for (const company of companies){
        await unlockFaction(ns,company)
    }
}