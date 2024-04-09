import { NS, ProcessInfo } from "@ns";
import { growPath } from "batching/grow";
import { weakenPath } from "batching/weaken";
import { hackPath } from "batching/hack";
import { prepareHostPath } from "/batching/prepareHost";

import { findBestTarget, getAllServers } from "/shared/utils";
import { Logging } from "/shared/logging";

export const hackingDaemonPath = "/batching/hackingDaemon.js";

export async function main(ns: NS): Promise<void> {
  const logging = new Logging(ns);
  await logging.initLogging();
  ns.disableLog("ALL");

  const servers = getAllServers(ns);

  killPrepScripts(ns);
  await waitForBatchedHackToFinish(ns);

  // if we dont have a server to target yet, wait until we do have.

  while (findBestTarget(ns) === "") {
    await ns.asleep(60000);
  }

  const target = findBestTarget(ns);

  // prepare the server for attack. max mon, min sec.
  for (const server of servers) {
    await ns.scp([prepareHostPath, weakenPath, growPath, hackPath], server);
  }
  //throw everything we have at it and wait for the threads to finish.
  const prepPid = servers.map((server) => {
    const ramAvalible =
      ns.getServer(server).maxRam - ns.getServer(server).ramUsed;
    if (ramAvalible / ns.getScriptRam(prepareHostPath) > 1)
      return ns.exec(
        prepareHostPath,
        server,
        Math.floor(ramAvalible / ns.getScriptRam(prepareHostPath)),
        target,
      );
    return 0;
  });
  await waitForPids(prepPid, ns);

  const hack_time = ns.getHackTime(target);
  const weak_time = ns.getWeakenTime(target);
  const grow_time = ns.getGrowTime(target);
  const t0 = 1000;

  let period = 0;
  let depth = 0;
  const kW_max = Math.floor(1 + (weak_time - 4 * t0) / (8 * t0));
  schedule: for (let kW = kW_max; kW >= 1; --kW) {
    const t_min_W = (weak_time + 4 * t0) / kW;
    const t_max_W = (weak_time - 4 * t0) / (kW - 1);
    const kG_min = Math.ceil(Math.max((kW - 1) * 0.8, 1));
    const kG_max = Math.floor(1 + kW * 0.8);
    for (let kG = kG_max; kG >= kG_min; --kG) {
      const t_min_G = (grow_time + 3 * t0) / kG;
      const t_max_G = (grow_time - 3 * t0) / (kG - 1);
      const kH_min = Math.ceil(Math.max((kW - 1) * 0.25, (kG - 1) * 0.3125, 1));
      const kH_max = Math.floor(Math.min(1 + kW * 0.25, 1 + kG * 0.3125));
      for (let kH = kH_max; kH >= kH_min; --kH) {
        const t_min_H = (hack_time + 5 * t0) / kH;
        const t_max_H = (hack_time - 1 * t0) / (kH - 1);
        const t_min = Math.max(t_min_H, t_min_G, t_min_W);
        const t_max = Math.min(t_max_H, t_max_G, t_max_W);
        if (t_min <= t_max) {
          period = t_min;
          depth = kW;
          break schedule;
        }
      }
    }
  }
  //depth - number of batches
  //period - one full cycle
  const startTime = Date.now();
  let event = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (event % 120 === 0) {
      await ns.asleep(60 * 1000);
      // //check we are hacking the right target
      const newTarget = findBestTarget(ns);
      if (
        newTarget !== target ||
        ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target) < 0.9
      ) {
        await waitForBatchedHackToFinish(ns);
        //restart
        ns.spawn(hackingDaemonPath);
      }
    }
    const scheduleWorked = await ScheduleHackEvent(
      event,
      weak_time,
      hack_time,
      grow_time,
      startTime,
      depth,
      period,
      t0,
      ns,
      target,
    );
    if (!scheduleWorked) {
      logging.error(`Unable to schedule batch task`, true);
      await ns.asleep((event % 120) * 1000);
    } else {
      event++;
    }
  }

  logging.info(`length of cycle: ${period}`);
  logging.info(`Number of cycles needed: ${depth}`);
}

async function waitForBatchedHackToFinish(ns: NS) {
  const logging = new Logging(ns);
  await logging.initLogging();
  logging.info(`waiting for current hacking threads to finish.`);
  const pids = getAllServers(ns)
    .map((server) => {
      return ns.ps(server);
    })
    .reduce((prev: ProcessInfo[], curr: ProcessInfo[]) => {
      return prev.concat(...curr);
    }, [] as ProcessInfo[])
    .filter((proc) => {
      return (
        proc.filename === weakenPath ||
        proc.filename === growPath ||
        proc.filename === hackPath
      );
    })
    .map((procInfo) => procInfo.pid);
  await waitForPids(pids, ns);
}

function killPrepScripts(ns: NS) {
  const logging = new Logging(ns);
  await logging.initLogging();
  logging.info(`Killing any preparation scripts.`);
  getAllServers(ns)
    .map((server) => {
      return ns.ps(server);
    })
    .reduce((prev: ProcessInfo[], curr: ProcessInfo[]) => {
      return prev.concat(...curr);
    }, [] as ProcessInfo[])
    .filter((proc) => {
      return proc.filename === prepareHostPath;
    })
    .forEach((proc) => {
      ns.kill(proc.pid);
    });
}

async function waitForPids(pids: number[], ns: NS) {
  const logging = new Logging(ns);
  await logging.initLogging();
  do {
    const finished = pids.filter((pid) => pid === 0 || !ns.isRunning(pid, ""));
    finished.forEach((pid) => pids.splice(pids.indexOf(pid), 1));
    logging.info(`${pids.length} processes left`);
    if (pids.length > 0) await ns.asleep(30 * 1000);
  } while (pids.length > 0);
}

async function ScheduleHackEvent(
  event: number,
  weak_time: number,
  hack_time: number,
  grow_time: number,
  startTime: number,
  depth: number,
  period: number,
  t0: number,
  ns: NS,
  target: string,
): Promise<boolean> {
  const logging = new Logging(ns);
  await logging.initLogging();
  let event_time = 0;
  let event_script = "";
  switch (event % 4) {
    case 1:
    case 3:
      event_time = weak_time;
      event_script = weakenPath;
      break;
    case 0:
      event_time = hack_time;
      event_script = hackPath;
      break;
    case 2:
      event_time = grow_time;
      event_script = growPath;
      break;
  }

  const script_start =
    startTime + depth * period - event * t0 * -1 - event_time;
  if (script_start < 0) {
    logging.error(`Wait time negative. restarting script.`, true);
    await ns.asleep(weak_time);
    ns.spawn(hackingDaemonPath, 1);
  }
  logging.info(
    `{"name":"${event_script}-${event}", "startTime":"${new Date(script_start).toISOString()}", "duration":${Math.floor(event_time / 1000)}}`,
  );
  logging.info(
    `${event_script}: To Complete ${new Date(script_start + event_time).toISOString()}`,
  );
  return runTask(ns, event_script, target, script_start);
}

async function runTask(
  ns: NS,
  script: string,
  ...args: (string | number | boolean)[]
): Promise<boolean> {
  const logging = new Logging(ns);
  await logging.initLogging();
  const servers = getAllServers(ns);
  //find a server with enough free memory to run the script.
  const scriptMem = ns.getScriptRam(script);
  const candidateServers = servers.filter((server) => {
    const serverInfo = ns.getServer(server);
    const memFree = serverInfo.maxRam - serverInfo.ramUsed;
    return (
      (serverInfo.backdoorInstalled || serverInfo.purchasedByPlayer) &&
      memFree > scriptMem
    );
  });
  if (candidateServers.length === 0) return false;
  await ns.scp(script, candidateServers[0]);
  const pid = ns.exec(script, candidateServers[0], 1, ...args);
  if (pid === 0) {
    logging.error(`Failed to run ${script} on ${candidateServers[0]}`);
    return false;
  }
  logging.info(`Scheduled ${script} to run on ${candidateServers[0]}`);
  return true;
}
