import { NS } from "@ns";
import { Logging } from "/shared/logging";

export class Game {
  readonly ns:NS
  readonly logging : Logging

  constructor(ns:NS, logging?:Logging){
    this.ns = ns
    this.logging = logging ?? new Logging(ns);
  }

}