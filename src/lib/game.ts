import { NS } from "@ns";
import { Logging } from "/shared/logging";

export class Game {
  readonly ns:NS
  readonly logging : Logging

  constructor(ns: NS){
    this.ns = ns;
    this.logging = new Logging(ns);
  }
}