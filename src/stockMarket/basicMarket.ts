import { NS } from '@ns';
import { Logging } from '/shared/logging';
import { Game } from '/lib/game';

export const basicMarketPath ="/stockMarket/basicMarket.js";

export async function main(ns : NS) : Promise<void> {
  const game = new Game(ns);
}