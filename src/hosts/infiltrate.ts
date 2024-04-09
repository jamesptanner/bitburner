import { NS } from "@ns";
import {
  getNumberOfTools,
  hasFTP,
  hasHTTP,
  hasSMTP,
  hasSQL,
  hasSSH,
} from "/shared/HGW";
import { Logging } from "/shared/logging";

export const infiltratePath = "/hosts/infiltrate.js";

const infiltrate = function (ns: NS, host: string) {
  const logging = new Logging(ns);
  await logging.initLogging();
  const targetHackLevel = ns.getServerRequiredHackingLevel(host);
  if (targetHackLevel > ns.getHackingLevel()) {
    logging.warning(`not able to hack host: ${host}(${targetHackLevel})`);
    return;
  }
  const server = ns.getServer(host);
  if (
    server.openPortCount !== undefined &&
    server.numOpenPortsRequired !== undefined &&
    server.openPortCount < server.numOpenPortsRequired
  ) {
    logging.info(
      `${server.openPortCount} ports open, ${server.numOpenPortsRequired} needed.`,
    );
    if (server.numOpenPortsRequired <= getNumberOfTools(ns)) {
      if (!server.ftpPortOpen && hasFTP(ns)) {
        ns.ftpcrack(host);
      }
      if (!server.httpPortOpen && hasHTTP(ns)) {
        ns.httpworm(host);
      }
      if (!server.sshPortOpen && hasSSH(ns)) {
        ns.brutessh(host);
      }
      if (!server.smtpPortOpen && hasSMTP(ns)) {
        ns.relaysmtp(host);
      }
      if (!server.sqlPortOpen && hasSQL(ns)) {
        ns.sqlinject(host);
      }
    }
    if (server.openPortCount < server.numOpenPortsRequired) {
      logging.warning(`not enough tools to hack host: ${host}`);
      return;
    }
  }
  logging.info(`nuking host: ${host}`);
  ns.nuke(host);
  logging.info(`host ready to backdoor: ${host}`);
};

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();
  if (ns.args.length === 1) {
    const target = ns.args[0];
    logging.info(`infiltrating target: ${target}`);
    if (typeof target === "string") {
      infiltrate(ns, target);
    }
  } else {
    const targets: Array<string> = JSON.parse(
      ns.read("toInfiltrate.txt") as string,
    );
    targets.forEach((target) => {
      logging.info(`infiltrating target: ${target}`);
      infiltrate(ns, target);
    });
  }
}
