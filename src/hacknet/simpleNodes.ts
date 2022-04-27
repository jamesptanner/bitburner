import { NodeStats, NS } from '@ns';

export const simpleNodesPath = "/hacknet/simpleNodes.js";

const nodeMaxedOut = function (node: PurchaseOption): boolean {
    return node.coreCost == null && node.ramCost === null && node.levelCost=== null;
}

type PurchaseOption = {
    nodeID: number
    coreCost: number
    ramCost: number
    levelCost: number
    nodeStat: NodeStats
}

export async function main(ns: NS): Promise<void> {
  await runHacknet(ns,()=>{return true});
}

export async function runHacknet(ns: NS,otherCheck?:()=>boolean):Promise<void> {
  if (ns.hacknet.numNodes() == 0) {
    while (ns.getPlayer().money < ns.hacknet.getPurchaseNodeCost()) {
      await ns.sleep(60 * 1000);
    }
    ns.hacknet.purchaseNode();
  }
  while (true) {
    const purchaseOptions: PurchaseOption[] = [];
    for (let index = 0; index < ns.hacknet.numNodes(); index++) {
      const option: PurchaseOption = {
        nodeID: index,
        coreCost: ns.hacknet.getCoreUpgradeCost(index, 1),
        ramCost: ns.hacknet.getRamUpgradeCost(index, 1),
        levelCost: ns.hacknet.getLevelUpgradeCost(index, 1),
        nodeStat: ns.hacknet.getNodeStats(index),
      };
      purchaseOptions.push(option);
    }

    const bestOption = purchaseOptions.reduce((prev, curr) => {
      ns.print(`${JSON.stringify(prev)} :  ${JSON.stringify(curr)}`);
      if (prev == null || nodeMaxedOut(prev)) {
        return curr;
      } else if (curr == null || nodeMaxedOut(curr)) {
        return prev;
      } else {
        if (Math.min(prev.coreCost, prev.levelCost, prev.ramCost) < Math.min(curr.coreCost, curr.levelCost, curr.ramCost))
          return prev;
        return curr;
      }
    });

    const lowestCost = Math.min(bestOption.coreCost, bestOption.ramCost, bestOption.levelCost, ns.hacknet.getPurchaseNodeCost());
    if (ns.getPlayer().money > lowestCost) {
      if (lowestCost === bestOption.coreCost) {
        ns.hacknet.upgradeCore(bestOption.nodeID, 1);
      }
      if (lowestCost === bestOption.ramCost) {
        ns.hacknet.upgradeRam(bestOption.nodeID, 1);
      }
      if (lowestCost === bestOption.levelCost) {
        ns.hacknet.upgradeLevel(bestOption.nodeID, 1);
      }
      if (lowestCost === ns.hacknet.getPurchaseNodeCost()) {
        ns.hacknet.purchaseNode();
      }
    }
    await ns.sleep(500);

    if(otherCheck !== undefined && !otherCheck()){
      break;
    }
  }
}
