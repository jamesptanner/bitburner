import { NS } from "@ns";
import { getAllServers } from "/shared/utils";

export async function main(ns: NS): Promise<void> {
  const servers = getAllServers(ns);

  for (const host of servers) {
    const lit = ns.ls(host, ".lit");
    if (lit.length > 0) {
      await ns.scp(lit, "home", host);
    }
  }
}
