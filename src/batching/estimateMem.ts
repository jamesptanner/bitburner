import { NS } from '@ns'
import { findBestTarget, getAllServers } from '/shared/utils';
import { weakenPath } from './weaken';
import { hackPath } from '/batching/hack';
import { growPath } from './grow';

export const hackingDaemonPath = "/batching/hackingDaemon.js";

export async function main(ns: NS): Promise<void> {
    ns.disableLog('ALL')
    const target = findBestTarget(ns)
    const servers = getAllServers(ns)
    // prepare the server for attack. max mon, min sec.
    const hack_time = ns.getHackTime(target)
    const weak_time = ns.getWeakenTime(target)
    const grow_time = ns.getGrowTime(target)
    const t0 = 1000

    let period = 0
    let depth = 0;
    const kW_max = Math.floor(1 + (weak_time - 4 * t0) / (8 * t0));
    schedule: for (let kW = kW_max; kW >= 1; --kW) {
        const t_min_W = (weak_time + 4 * t0) / kW;
        const t_max_W = (weak_time - 4 * t0) / (kW - 1);
        const kG_min = Math.ceil(Math.max((kW - 1) * 0.8, 1));
        const kG_max = Math.floor(1 + kW * 0.8);
        for (let kG = kG_max; kG >= kG_min; --kG) {
            const t_min_G = (grow_time + 3 * t0) / kG
            const t_max_G = (grow_time - 3 * t0) / (kG - 1);
            const kH_min = Math.ceil(Math.max((kW - 1) * 0.25, (kG - 1) * 0.3125, 1));
            const kH_max = Math.floor(Math.min(1 + kW * 0.25, 1 + kG * 0.3125));
            for (let kH = kH_max; kH >= kH_min; --kH) {
                const t_min_H = (hack_time + 5 * t0) / kH;
                const t_max_H = (hack_time - 1 * t0) / (kH - 1);
                const t_min = Math.max(t_min_H, t_min_G, t_min_W);
                const t_max = Math.min(t_max_H, t_max_G, t_max_W);
                if (t_min <= t_max) {
                    period = t_min;
                    depth = kW;
                    break schedule;
                }
            }
        }
    }
    //depth - number of batches
    //period - one full cycle
    ns.printf(`length of cycle: ${ns.tFormat(period)}`)
    ns.printf(`Number of cycles needed: ${depth}`)
    ns.printf(`number of tasks: ${depth*4}`)
    const growMem = ns.getScriptRam(growPath)
    const hackMem = ns.getScriptRam(hackPath)
    const weakenMem = ns.getScriptRam(weakenPath)

    const totalMemory = servers.map(x => ns.getServerMaxRam(x)).reduce((prev,next)=>{
        return prev + next
    })

    ns.printf(`totalMemory Available: ${totalMemory}`)
    ns.printf(`totalMemoryNeeded: ${(growMem +hackMem+(weakenMem*2))*depth}`)

}
