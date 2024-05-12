import { NS } from "@ns";
import { scripts } from "/shared/HGW";
import { Logging } from "/shared/logging";
import { needToFocus } from "/shared/utils";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();

  const player = ns.getPlayer();
  for (const iterator of scripts) {
    const script = iterator[0];
    const cost = iterator[1];
    if (!ns.fileExists(script) && player.skills.hacking >= cost) {
      logging.info(`You should work on new script: ${script}`);
      if (!ns.singularity.isBusy()) {
        logging.info(`working on new script ${script}`);
        ns.singularity.createProgram(script, needToFocus(ns));
      }
    }
  }
}
