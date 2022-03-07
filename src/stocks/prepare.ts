import { NS } from '@ns'

export const preparePath ="/stocks/prepare.js";

export async function main(ns : NS) : Promise<void> {
    const playerInfo = ns.getPlayer()
    if(playerInfo.hasWseAccount && playerInfo.hasTixApiAccess){
        ns.toast("Unable to setup market access. Purchase TIX and WSE access.","warning",10000)
        ns.exit()
    }
    while(!ns.stock.purchase4SMarketData()  || ns.stock.purchase4SMarketDataTixApi()){
        await ns.sleep(1000*60*15)
    }
    // ns.exec("")
}