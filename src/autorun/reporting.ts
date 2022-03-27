import { NS } from '@ns'
import { initLogging, sendMetric,log, Level } from '/shared/logging';
import { getAllServers } from '/shared/utils';

export const reportingPath ="/autorun/reporting.js";

export async function main(ns : NS) : Promise<void> {
    initLogging(ns)
    while(true){
        const player = ns.getPlayer()
        sendMetric("player.money",player.money)
        sendMetric("player.stats.level.hack",player.hacking)
        sendMetric("player.stats.level.strength",player.strength)
        sendMetric("player.stats.level.defense",player.defense)
        sendMetric("player.stats.level.dexterity",player.dexterity)
        sendMetric("player.stats.level.agility",player.agility)
        sendMetric("player.stats.level.charisma",player.charisma)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore property is intentionally undocumented.
        sendMetric("player.stats.level.karma",ns.heart.break())
        sendMetric("player.bitnode",player.bitNodeN)

        getAllServers(ns).concat('home').filter(server =>{
            const serverInfo = ns.getServer(server)
            return serverInfo.backdoorInstalled || serverInfo.purchasedByPlayer
        })
        .forEach(server =>{
            log(Level.Info,`server:${server} ramused:${ns.getServerUsedRam(server)} rammax:${ns.getServerMaxRam(server)}`)
        })

        await ns.sleep(15000)
    }
}