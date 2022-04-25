import { NS } from '@ns';
import { initLogging, Level, log, sendMetric } from '/shared/logging';
import { getAllServers } from '/shared/utils';

export const reportingPath ="/autorun/reporting.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    const constPlayer = ns.getPlayer()
    // if(constPlayer.bitNodeN !=5 || ns.getOwnedSourceFiles()[5].>){
    //     const bitnodeMultiplier = ns.getBitNodeMultipliers()
    // }

    sendMetric("player.multiplier.hacking.chance",constPlayer.hacking_chance_mult)
    sendMetric("player.multiplier.hacking.speed",constPlayer.hacking_speed_mult)
    sendMetric("player.multiplier.hacking.money",constPlayer.hacking_money_mult)
    sendMetric("player.multiplier.hacking.growth",constPlayer.hacking_grow_mult)

    sendMetric("player.multiplier.stat.hacking.level",constPlayer.hacking_mult)
    sendMetric("player.multiplier.stat.hacking.exp",constPlayer.hacking_exp_mult)
    sendMetric("player.multiplier.stat.strength.level",constPlayer.strength_mult)
    sendMetric("player.multiplier.stat.strength.exp",constPlayer.strength_exp_mult)
    sendMetric("player.multiplier.stat.defense.level",constPlayer.defense_mult)
    sendMetric("player.multiplier.stat.defense.exp",constPlayer.defense_exp_mult)
    sendMetric("player.multiplier.stat.dexterity.level",constPlayer.dexterity_mult)
    sendMetric("player.multiplier.stat.dexterity.exp",constPlayer.dexterity_exp_mult)
    sendMetric("player.multiplier.stat.agility.level",constPlayer.agility_mult)
    sendMetric("player.multiplier.stat.agility.exp",constPlayer.agility_exp_mult)
    sendMetric("player.multiplier.stat.charisma.level",constPlayer.charisma_mult)
    sendMetric("player.multiplier.stat.charisma.exp",constPlayer.charisma_exp_mult)

    sendMetric("player.multiplier.hacknet.node.production",constPlayer.hacknet_node_money_mult)
    sendMetric("player.multiplier.hacknet.node.purchase_cost",constPlayer.hacknet_node_purchase_cost_mult)
    sendMetric("player.multiplier.hacknet.node.ram_upgrade_cost",constPlayer.hacknet_node_ram_cost_mult)
    sendMetric("player.multiplier.hacknet.node.core_upgrade_cost",constPlayer.hacknet_node_core_cost_mult)
    sendMetric("player.multiplier.hacknet.node.level_upgrade_cost",constPlayer.hacknet_node_level_cost_mult)

    sendMetric("player.multiplier.reputation.faction_gain",constPlayer.faction_rep_mult)
    sendMetric("player.multiplier.reputation.company_gain",constPlayer.company_rep_mult)
    sendMetric("player.multiplier.reputation.salary",constPlayer.work_money_mult)
    sendMetric("player.multiplier.hacknet.node.level_upgrade_cost",constPlayer.hacknet_node_level_cost_mult)

    sendMetric("player.multiplier.crime.success",constPlayer.crime_success_mult)
    sendMetric("player.multiplier.crime.money",constPlayer.crime_money_mult)

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
        getAllServers(ns).concat('home')
        .forEach(server => {
            const ServerInfo = ns.getServer(server)
            sendMetric(`server.${server.replaceAll(".","-")}.backdoorInstalled`, ServerInfo.backdoorInstalled ? 1:0)
            sendMetric(`server.${server.replaceAll(".","-")}.playerOwned`, ServerInfo.purchasedByPlayer? 1:0)
            sendMetric(`server.${server.replaceAll(".","-")}.requiredHacking`, ServerInfo.requiredHackingSkill? 1:0)
            sendMetric(`server.${server.replaceAll(".","-")}.backdoorable`, ServerInfo.openPortCount >= ServerInfo.numOpenPortsRequired? 1:0)
            sendMetric(`server.${server.replaceAll(".","-")}.maxRam`, ns.getServerMaxRam(server))
            sendMetric(`server.${server.replaceAll(".","-")}.usedRam`, ns.getServerUsedRam(server))
            sendMetric(`server.${server.replaceAll(".","-")}.securitylevel`, ns.getServerSecurityLevel(server))
            sendMetric(`server.${server.replaceAll(".","-")}.minsecuritylevel`, ns.getServerMinSecurityLevel(server))
            sendMetric(`server.${server.replaceAll(".","-")}.money`, ns.getServerMoneyAvailable(server))
            sendMetric(`server.${server.replaceAll(".","-")}.maxmoney`, ns.getServerMaxMoney(server))
        })
        await ns.sleep(60000)
    }
}