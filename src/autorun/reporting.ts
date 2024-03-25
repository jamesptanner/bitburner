import { NS } from '@ns';
import { initLogging, Level, log, sendMetric } from '/shared/logging';
import { getAllServers } from '/shared/utils';

export const reportingPath = "/autorun/reporting.js";


const getBitnode = function (ns: NS): number {
    const player = ns.getPlayer()
    const bitnode = ns.singularity.getOwnedSourceFiles().filter(src => { return src.n === ns.getResetInfo().currentNode })[0]
    if (bitnode) return Number.parseInt(`${bitnode.n}.${bitnode.lvl}`)
    return Number.parseInt(`${ns.getResetInfo()}.0`)
}
export async function main(ns: NS): Promise<void> {
    await initLogging(ns)
    const constPlayer = ns.getPlayer().mults
    // if(constPlayer.bitNodeN !=5 || ns.getOwnedSourceFiles()[5].>){
    //     const bitnodeMultiplier = ns.getBitNodeMultipliers()
    // }

    sendMetric("player.multiplier.hacking.chance", constPlayer.hacking_chance || -1)
    sendMetric("player.multiplier.hacking.speed", constPlayer.hacking_speed || -1)
    sendMetric("player.multiplier.hacking.money", constPlayer.hacking_money || -1)
    sendMetric("player.multiplier.hacking.growth", constPlayer.hacking_grow || -1)

    sendMetric("player.multiplier.stat.hacking.level", constPlayer.hacking || -1)
    sendMetric("player.multiplier.stat.hacking.exp", constPlayer.hacking_exp || -1)
    sendMetric("player.multiplier.stat.strength.level", constPlayer.strength || -1)
    sendMetric("player.multiplier.stat.strength.exp", constPlayer.strength_exp || -1)
    sendMetric("player.multiplier.stat.defense.level", constPlayer.defense || -1)
    sendMetric("player.multiplier.stat.defense.exp", constPlayer.defense_exp || -1)
    sendMetric("player.multiplier.stat.dexterity.level", constPlayer.dexterity || -1)
    sendMetric("player.multiplier.stat.dexterity.exp", constPlayer.dexterity_exp || -1)
    sendMetric("player.multiplier.stat.agility.level", constPlayer.agility || -1)
    sendMetric("player.multiplier.stat.agility.exp", constPlayer.agility_exp || -1)
    sendMetric("player.multiplier.stat.charisma.level", constPlayer.charisma || -1)
    sendMetric("player.multiplier.stat.charisma.exp", constPlayer.charisma_exp || -1)

    sendMetric("player.multiplier.hacknet.node.production", constPlayer.hacknet_node_money || -1)
    sendMetric("player.multiplier.hacknet.node.purchase_cost", constPlayer.hacknet_node_purchase_cost || -1)
    sendMetric("player.multiplier.hacknet.node.ram_upgrade_cost", constPlayer.hacknet_node_ram_cost || -1)
    sendMetric("player.multiplier.hacknet.node.core_upgrade_cost", constPlayer.hacknet_node_core_cost || -1)
    sendMetric("player.multiplier.hacknet.node.level_upgrade_cost", constPlayer.hacknet_node_level_cost || -1)

    sendMetric("player.multiplier.reputation.faction_gain", constPlayer.faction_rep || -1)
    sendMetric("player.multiplier.reputation.company_gain", constPlayer.company_rep || -1)
    sendMetric("player.multiplier.reputation.salary", constPlayer.work_money || -1)
    sendMetric("player.multiplier.hacknet.node.level_upgrade_cost", constPlayer.hacknet_node_level_cost || -1)

    sendMetric("player.multiplier.crime.success", constPlayer.crime_success || -1)
    sendMetric("player.multiplier.crime.money", constPlayer.crime_money || -1)

    while (true) {
        const player = ns.getPlayer()
        sendMetric("player.money", player.money)
        sendMetric("player.stats.level.hack", player.skills.hacking)
        sendMetric("player.stats.level.strength", player.skills.strength)
        sendMetric("player.stats.level.defense", player.skills.defense)
        sendMetric("player.stats.level.dexterity", player.skills.dexterity)
        sendMetric("player.stats.level.agility", player.skills.agility)
        sendMetric("player.stats.level.charisma", player.skills.charisma)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore property is intentionally undocumented.
        sendMetric("player.stats.level.karma", ns.heart.break())
        sendMetric("player.bitnode", getBitnode(ns))

        getAllServers(ns).concat('home').filter(server => {
            const serverInfo = ns.getServer(server)
            return serverInfo.backdoorInstalled || serverInfo.purchasedByPlayer
        })
            .forEach(server => {
                log(Level.Info, `server:${server} ramused:${ns.getServerUsedRam(server)} rammax:${ns.getServerMaxRam(server)}`)
            })
        getAllServers(ns).concat('home')
            .forEach(server => {
                const ServerInfo = ns.getServer(server)
                sendMetric(`server.${server.replaceAll(".", "-")}.hackstate`, getHackState(ns, server))
                sendMetric(`server.${server.replaceAll(".", "-")}.playerOwned`, ServerInfo.purchasedByPlayer ? 1 : 0)
                sendMetric(`server.${server.replaceAll(".", "-")}.maxRam`, ns.getServerMaxRam(server))
                sendMetric(`server.${server.replaceAll(".", "-")}.usedRam`, ns.getServerUsedRam(server))
                sendMetric(`server.${server.replaceAll(".", "-")}.securitylevel`, ns.getServerSecurityLevel(server))
                sendMetric(`server.${server.replaceAll(".", "-")}.minsecuritylevel`, ns.getServerMinSecurityLevel(server))
                sendMetric(`server.${server.replaceAll(".", "-")}.money`, ns.getServerMoneyAvailable(server))
                sendMetric(`server.${server.replaceAll(".", "-")}.maxmoney`, ns.getServerMaxMoney(server))
            })
        await ns.sleep(90000)
    }
}
const getHackState = function (ns: NS, server: string): number {
    const ServerInfo = ns.getServer(server)

    if (ServerInfo && (ServerInfo.backdoorInstalled || ServerInfo.purchasedByPlayer)) return 2
    if (ServerInfo && ( ServerInfo.openPortCount && ServerInfo.numOpenPortsRequired && ServerInfo.openPortCount >= ServerInfo.numOpenPortsRequired) && ( ServerInfo.requiredHackingSkill && ServerInfo.requiredHackingSkill <= ns.getPlayer().skills.hacking)) return 1;
    return 0
}