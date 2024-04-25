import { NS } from "@ns";
import { Logging } from "/shared/logging";

export class Game {
  readonly ns:NS
  readonly logging : Logging

  constructor(ns: NS){
    this.ns = ns;
    this.logging = new Logging(ns);
  }

  private seed: number | undefined 
  private reinvestment: number | undefined 
  private max :number | undefined 
  public setScriptSeedReinvestment(seed: number, reinvestment: number, max?: number ){
    this.seed = seed;
    this.reinvestment =reinvestment;
    this.max = max;
  }

  public getMyScriptIncome(){
    const thisScript = this.ns.getRunningScript();
    this.ns.getMoneySources
    return (thisScript?.offlineMoneyMade ??0) + (thisScript?.onlineMoneyMade ??0);
  }
  public getAvailibleMoney() : number{
    return 0;
  }
  
}