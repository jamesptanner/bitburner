import { NS } from "@ns";

import { getAllServers, routeToHost, walk } from "/shared/utils";
import { Logging } from "/shared/logging";

export const checkRemoteServersPath = "/cron/checkRemoteServers.js";

export async function main(ns: NS): Promise<void> {
  const servers = getAllServers(ns);

  for (let index = 0; index < servers.length; index++) {
    const logging = new Logging(ns);
    await logging.initLogging();
    const host = servers[index];
    let serverInfo = ns.getServer(host);

    //if we are rooted and nuked then we dont need to do anything.
    if (!(serverInfo.backdoorInstalled && serverInfo.hasAdminRights)) {
      logging.info(
        `Checking ${host}. State: backdoor:${serverInfo.backdoorInstalled} root:${serverInfo.hasAdminRights}`,
      );
      //first check our hacking level is sufficiant
      if (
        serverInfo.requiredHackingSkill &&
        serverInfo.requiredHackingSkill > ns.getPlayer().skills.hacking
      ) {
        logging.warning(
          `We dont have the skills to hack ${host} (${serverInfo.requiredHackingSkill})`,
        );
        continue;
      }
      logging.info(
        `open ports: ${serverInfo.openPortCount}/${serverInfo.numOpenPortsRequired}`,
      );
      //lets check if we have enough ports open
      if (
        serverInfo.numOpenPortsRequired !== undefined &&
        serverInfo.openPortCount !== undefined &&
        serverInfo.openPortCount < serverInfo.numOpenPortsRequired
      ) {
        // need to open some ports. Open what we can and check again
        if (!serverInfo.ftpPortOpen && ns.fileExists("ftpcrack.exe")) {
          logging.info("ftpcrack");
          ns.ftpcrack(host);
        }
        if (!serverInfo.httpPortOpen && ns.fileExists("httpworm.exe")) {
          logging.info("httpworm");
          ns.httpworm(host);
        }
        if (!serverInfo.sshPortOpen && ns.fileExists("brutessh.exe")) {
          logging.info("brutessh");
          ns.brutessh(host);
        }
        if (!serverInfo.smtpPortOpen && ns.fileExists("relaysmtp.exe")) {
          logging.info("relaysmtp");
          ns.relaysmtp(host);
        }
        if (!serverInfo.sqlPortOpen && ns.fileExists("sqlinject.exe")) {
          logging.info("sqlinject");
          ns.sqlinject(host);
        }
        serverInfo = ns.getServer(host);

        if (
          serverInfo.numOpenPortsRequired !== undefined &&
          serverInfo.openPortCount !== undefined &&
          serverInfo.openPortCount < serverInfo.numOpenPortsRequired
        ) {
          logging.warning(`Need more tools to backdoor ${host}`);
          continue;
        }
      }
      if (!serverInfo.hasAdminRights && ns.fileExists("nuke.exe")) {
        logging.info("nuke.exe");
        ns.nuke(host);
      }
      serverInfo = ns.getServer(host);
      if (serverInfo.hasAdminRights && !serverInfo.backdoorInstalled) {
        if (
          ns.getResetInfo().ownedSF.has(4) ||
          ns.getResetInfo().currentNode === 4
        ) {
          logging.info("Installing backdoor");
          ns.singularity.connect("home");
          const route = routeToHost(ns, "home", host);

          for (let routeIndex = 0; routeIndex < route.length; routeIndex++) {
            const routeHost = route[routeIndex];
            ns.singularity.connect(routeHost);
          }
          await ns.singularity.installBackdoor();
          ns.singularity.connect("home");
          logging.info(`Backdoor installed on ${host}`, true);
        } else {
          logging.warning(`Need to backdoor ${host} manually`, true);
        }
      }
    }
  }
}
