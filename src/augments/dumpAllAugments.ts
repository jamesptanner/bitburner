import { NS } from '@ns';
import { factions, getAllAugmentsFromFaction } from '/shared/factions';
import { initLogging } from '/shared/logging';
import { makeTable } from '/shared/ui';
import { unique } from '/shared/utils';

export const dumpAllAugmentsPath ="/augments/dumpAllAugments.js";

export async function main(ns : NS) : Promise<void> {
    await initLogging(ns)
    ns.clearLog()
    ns.tail()
    const augments:string[] = ns.singularity.getOwnedAugmentations(true)
    factions.forEach(faction => {
        augments.push(...getAllAugmentsFromFaction(ns,faction))
    });

    const flags = ns.flags([['player',false],['hacking',false],['faction',false],['hacknet',false],['bladeburner',false],['all',false]])


    const NToS = function(val?:number):string{
        if(val===undefined) return '-'
        return ns.nFormat(val,'0,0.000')
    }
    const augmentData = augments.filter(unique).sort().map(augment =>{ 
        const augmentInfo = ns.singularity.getAugmentationStats(augment)
        const player = [NToS(augmentInfo.hacking_mult),NToS(augmentInfo.strength_mult),NToS(augmentInfo.defense_mult),NToS(augmentInfo.dexterity_mult),NToS(augmentInfo.agility_mult),NToS(augmentInfo.charisma_mult),
            NToS(augmentInfo.hacking_exp_mult),NToS(augmentInfo.strength_exp_mult),NToS(augmentInfo.defense_exp_mult),NToS(augmentInfo.dexterity_exp_mult),NToS(augmentInfo.agility_exp_mult),NToS(augmentInfo.charisma_exp_mult)]
        const hacking = [NToS(augmentInfo.hacking_chance_mult),NToS(augmentInfo.hacking_speed_mult),NToS(augmentInfo.hacking_money_mult),NToS(augmentInfo.hacking_grow_mult)]
        const faction = [NToS(augmentInfo.company_rep_mult),NToS(augmentInfo.faction_rep_mult),NToS(augmentInfo.crime_money_mult),NToS(augmentInfo.crime_success_mult),NToS(augmentInfo.work_money_mult)]
        const hacknet = [NToS(augmentInfo.hacknet_node_money_mult),NToS(augmentInfo.hacknet_node_purchase_cost_mult),NToS(augmentInfo.hacknet_node_ram_cost_mult),NToS(augmentInfo.hacknet_node_core_cost_mult),NToS(augmentInfo.hacknet_node_level_cost_mult)]
        const bladeburner = [NToS(augmentInfo.bladeburner_max_stamina_mult),NToS(augmentInfo.bladeburner_stamina_gain_mult),NToS(augmentInfo.bladeburner_analysis_mult),NToS(augmentInfo.bladeburner_success_chance_mult)]

        return [player,hacking,faction,hacknet,bladeburner]
    })
    const defaultData = augments.filter(unique).sort().map(augment =>{return [augment,ns.nFormat(ns.singularity.getAugmentationPrice(augment),'($ 0.00a)')]})
    const defaultHeaders = ['augment','price']
    const playerHeaders = ['hack','str','def','dex','agi','cha', 'hack xp', 'str xp', 'def xp', 'dex xp', 'agi xp', 'cha xp']
    const hackingHeaders = ['hack chance','hack speed','hack money','hack growth']
    const factionHeaders = ['comp rep','fact rep','crime mon','crime success','work mon']
    const hacknetHeaders = ['hacknet node mon','hacknet node cost','hacknet ram cost','hacknet core cost','hacknet level cost']
    const bladeburnerHeaders = ['bladeburner stamina','bladeburner stamina gain','bladeburner analysis','bladeburner success']

    const playerInfo = augmentData.map(ad => {return ad[0]})
    const hackingInfo = augmentData.map(ad => {return ad[1]})
    const factionInfo = augmentData.map(ad => {return ad[2]})
    const hacknetInfo = augmentData.map(ad => {return ad[3]})
    const bladeburnerInfo = augmentData.map(ad => {return ad[4]})

    const tableHeaders = defaultHeaders
    const tableData = defaultData
    if(flags.player || flags.all){
        tableHeaders.push(...playerHeaders)
        tableData.forEach((v,i)=>{v.push(...playerInfo[i])})
    }

    if(flags.hacking || flags.all){
        tableHeaders.push(...hackingHeaders)
        tableData.forEach((v,i)=>{v.push(...hackingInfo[i])})

    }

    if(flags.faction || flags.all){
        tableHeaders.push(...factionHeaders)
        tableData.forEach((v,i)=>{v.push(...factionInfo[i])})

    }

    if(flags.hacknet || flags.all){
        tableHeaders.push(...hacknetHeaders)
        tableData.forEach((v,i)=>{v.push(...hacknetInfo[i])})

    }

    if(flags.bladeburner || flags.all){
        tableHeaders.push(...bladeburnerHeaders)
        tableData.forEach((v,i)=>{v.push(...bladeburnerInfo[i])})

    }
    const filteredData = (flags.all || flags.player || flags.hacking || flags.faction || flags.hacknet || flags.bladeburner) ? tableData.filter(val =>{
        return !val.every((v,i)=>{return i===0 || i===1 ||v==='-'})
    }) : tableData
    makeTable(ns,tableHeaders,filteredData,1)
}