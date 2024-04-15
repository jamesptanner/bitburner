import { NS } from '@ns';
import { Game } from '/lib/game';
import { solveContractPath } from '/contracts/solveContract';

export const contractTestingPath ="/contracts/contractTesting.js";

export async function main(ns : NS) : Promise<void> {
  const game = new Game(ns);
  
  const contractTypes = ns.codingcontract.getContractTypes();
  contractTypes.forEach(type =>{
    const contractFilename = ns.codingcontract.createDummyContract(type);
    game.logging.info(`creating test "${type}" contract: ${contractFilename}`)
    ns.exec(solveContractPath,"home",{},contractFilename, "home");
  })
}