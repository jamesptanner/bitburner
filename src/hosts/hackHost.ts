import { NS } from "@ns";
import { growServer, hackServer, weakenServer } from "/shared/HGW";
import { Logging } from "/shared/logging";

export const hackHostPath = "/hosts/hackHost.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();
  const flags = ns.flags([["host", ns.getHostname()]]);
  const target = flags.host;

  logging.info(`hacking target: ${target}`);
  if (typeof target === "string") {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const current = ns.getServerMoneyAvailable(target);
      const max = ns.getServerMaxMoney(target);
      const percent = current / max;
      logging.info(`${target} money, curr:${current} max:${max} ${percent}%%`);
      if (
        !(
          ns.getServerSecurityLevel(target) <
          ns.getServerMinSecurityLevel(target) + 1
        )
      ) {
        logging.info(
          `😷: ${target}. ${(ns.getWeakenTime(target) / 1000).toFixed(2)}s`,
        );
        await weakenServer(ns, target);
      } else if (percent < 1) {
        logging.info(
          `🎈: ${target}. ${(ns.getGrowTime(target) / 1000).toFixed(2)}s`,
        );
        await growServer(ns, target);
      } else {
        logging.info(
          `🤖: ${target}. ${(ns.getHackTime(target) / 1000).toFixed(2)}s`,
        );
        await hackServer(ns, target);
      }
    }
  }
}
