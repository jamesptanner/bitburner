import { NS } from "@ns";
import { cacheAllServers, getAllServers, ServerInfo } from "/shared/utils";

export const getHostsPath = "/startup/getHosts.js";

export async function main(ns: NS): Promise<void> {
  await cacheAllServers(ns);
  const serverInfos: Map<string, ServerInfo> = new Map<string, ServerInfo>();
  getAllServers(ns).forEach(async (server) => {
    const collectedServerInfo = ns.getServer(server);
    if (
      collectedServerInfo &&
      collectedServerInfo.moneyMax &&
      collectedServerInfo.minDifficulty
    ) {
      const serverInfo: ServerInfo = {
        cores: collectedServerInfo.cpuCores,
        maxMoney: collectedServerInfo.moneyMax,
        minSecurity: collectedServerInfo.minDifficulty,
      };
      serverInfos.set(server, serverInfo);
    }
  });
  await ns.write(
    `servers.txt`,
    JSON.stringify(Object.fromEntries(serverInfos)),
    "w",
  );
}
