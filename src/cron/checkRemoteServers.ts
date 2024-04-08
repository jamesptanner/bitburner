import { NS } from '@ns';
import { initLogging, logging } from '/shared/logging';
import { getAllServers, routeToHost, walk } from '/shared/utils';
import { hasFTP, hasHTTP, hasSMTP, hasSQL, hasSSH } from '/shared/HGW';

export const checkRemoteServersPath = "/cron/checkRemoteServers.js";

export async function main(ns: NS): Promise<void> {
  await initLogging(ns)

  const servers = getAllServers(ns);

  for (let index = 0; index < servers.length; index++) {
    const host = servers[index];
    const serverInfo = ns.getServer(host);

    //if we are rooted and nuked then we dont need to do anything.
    if (!(serverInfo.backdoorInstalled && serverInfo.hasAdminRights)) {
      logging.info(`Checking ${host}. State: backdoor:${serverInfo.backdoorInstalled} root:${serverInfo.hasAdminRights}`)
      //first check our hacking level is sufficiant 
      if(serverInfo.requiredHackingSkill && serverInfo.requiredHackingSkill > ns.getPlayer().skills.hacking){
        logging.warning(`We dont have the skills to hack ${host}`);
        continue;
      }

      //lets check if we have enough ports open
      if (serverInfo.numOpenPortsRequired  && serverInfo.openPortCount && serverInfo.openPortCount < serverInfo.numOpenPortsRequired) {
        // need to open some ports. Open what we can and check again
        if (!serverInfo.ftpPortOpen && hasFTP(ns)) {
          logging.info("ftpcrack");
          ns.ftpcrack(host);
        }
        if (!serverInfo.httpPortOpen && hasHTTP(ns)) {
          logging.info("httpworm");
          ns.httpworm(host);
        }
        if (!serverInfo.sshPortOpen && hasSSH(ns)) {
          logging.info("brutessh");
          ns.brutessh(host);
        }
        if (!serverInfo.smtpPortOpen && hasSMTP(ns)) {
          logging.info("relaysmtp");
          ns.relaysmtp(host);
        }
        if (!serverInfo.sqlPortOpen && hasSQL(ns)) {
          logging.info("sqlinject");
          ns.sqlinject(host);
        }
        if(serverInfo.openPortCount < serverInfo.numOpenPortsRequired){
          logging.warning(`Need more tools to backdoor ${host}`);
          continue;
        }
      }
      if(!serverInfo.hasAdminRights && ns.fileExists("nuke.exe")){
          logging.info("nuke.exe");
          ns.nuke(host);
      }
      if(!serverInfo.backdoorInstalled){

        if(ns.getResetInfo().ownedSF.has(4) || ns.getResetInfo().currentNode === 4){
          logging.info("Installing backdoor");
          ns.singularity.connect("home");
          const route = routeToHost(ns,"home",host);

          for (let routeIndex = 0; routeIndex < route.length; routeIndex++) {
            const routeHost = route[routeIndex];
            ns.singularity.connect(routeHost);
          }
          await ns.singularity.installBackdoor();
          ns.singularity.connect("home");
          logging.info(`Backdoor installed on ${host}`,true);
        }
        else {
          logging.warning(`Need to backdoor ${host} manually`, true);
        }

      }
    }

  }

}