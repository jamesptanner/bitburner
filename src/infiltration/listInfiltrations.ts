import { NS } from '@ns';
import { Game } from '/lib/game'
import { makeTable } from '/shared/ui';

export const listInfiltrationsPath ="/infiltration/listInfiltrations.js";

export async function main(ns : NS) : Promise<void> {
  const game = new Game(ns);
  await game.logging.initLogging();


  const infiltrationDetails = ns.infiltration.getPossibleLocations()
      .map(location =>{
        return ns.infiltration.getInfiltration(location.name)
      })
      .map(infiltrationINfo =>{
        return [infiltrationINfo.location.city, infiltrationINfo.location.name, infiltrationINfo.difficulty, infiltrationINfo.reward.sellCash, infiltrationINfo.reward.tradeRep]
      })
      .sort((a,b) => {return (b[3] as number) - (a[3] as number)});

  game.logging.info(makeTable(game.ns,["City", "Location","Difficulty", "Cash", "Reputation"],infiltrationDetails,1))
  game.ns.tail();
}