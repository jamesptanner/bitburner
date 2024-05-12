import { NS } from "@ns";
import { asNumber, asString } from "/shared/utils";
import { Logging } from "/shared/logging";

export const triggerJobPath = "/cron/triggerJob.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();
  const args = Array.from(ns.args);
  let tmp = args.shift();
  if (!tmp) {
    logging.error(`no interval provided`);
    return;
  }
  const interval = asNumber(tmp);
  tmp = args.shift();
  if (!tmp) {
    logging.error(`no script provided`);
    return;
  }
  const script = asString(tmp);
  ns.print(`setting up cronjob: ${script}`);
  await ns.sleep(Math.random() * interval);
  while (interval && script) {
    const pid = ns.run(script, {threads:1, temporary:true}, ...args);

    if (pid === 0) {
      ns.print(`failed to start script.`);
    }
    ns.print(`cronjob triggered.`);
    logging.info(`Running ${script}`, true);
    do {

    await ns.asleep(interval)
    } while (ns.getRunningScript(pid) !== null)

  }
}
