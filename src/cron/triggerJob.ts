import { NS } from '@ns';
import { asNumber, asString } from '/shared/utils';
import { Logging } from '/shared/logging';


export const triggerJobPath = "/cron/triggerJob.js";

export async function main(ns: NS): Promise<void> {
  
  const logging = new Logging(ns);
  const args = Array.from(ns.args)
  let tmp = args.shift()
  if (!tmp) {
    logging.error(`no interval provided`)
    return
  }
  const interval = asNumber(tmp)
  tmp = args.shift()
  if (!tmp) {
    logging.error(`no script provided`)
    return
  }
  const script = asString(tmp)
  ns.print(`setting up cronjob: ${script}`)
  await ns.sleep(Math.random() * interval)
  while (interval && script) {

    const pid = ns.run(script, 1, ...args)

    if (pid === 0) {
      ns.print(`failed to start script.`)
    }
    ns.print(`cronjob triggered.`)
    logging.info(`Running ${script}`,true);
    await ns.asleep(interval).catch(() => logging.info("did I get killed while sleeping"))
    ns.print("loop end")

  }


}