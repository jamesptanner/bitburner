import { NS } from '@ns'

export const simpleNodesPath ="/hacknet/simpleNodes.js";

const maxLevel = 200;
const maxRam = 64;//gb
const maxCores = 16;

const nodeMaxedOut = function(ns:NS, nodeId: number): boolean{
    const nodeDetails = ns.hacknet.getNodeStats(nodeId);
    return nodeDetails.cores ==maxCores && nodeDetails.level === maxLevel && nodeDetails.ram===maxRam;
}

export async function main(ns : NS) : Promise<void> {
let currentNode = 0;
while(true){
    while(!nodeMaxedOut(ns,currentNode)){

        //we will just order the cheapest.
        //in the future with formulas.exe we can caculate the best ROI.
        const coreCost = ns.hacknet.getCoreUpgradeCost(currentNode,1)
        const ramCost = ns.hacknet.getRamUpgradeCost(currentNode,1)
        const levelCost = ns.hacknet.getLevelUpgradeCost(currentNode,1);
        const lowestCost = Math.min(coreCost,ramCost,levelCost)
        if (ns.getPlayer().money > lowestCost){
            if(lowestCost === coreCost){
                ns.hacknet.upgradeCore(currentNode,1)
            }
            if(lowestCost === ramCost){
                ns.hacknet.upgradeRam(currentNode,1)
            }
            if(lowestCost === levelCost){
                ns.hacknet.upgradeLevel(currentNode,1)
            }
        }
        await ns.sleep(60*1000);
    }
    currentNode++;
    if(currentNode == ns.hacknet.numNodes()){
        while (ns.getPlayer().money < ns.hacknet.getPurchaseNodeCost()){
            await ns.sleep(60*1000)
        }
        ns.hacknet.purchaseNode()
    }
}
}