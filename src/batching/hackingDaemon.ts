import { NS, ProcessInfo } from "@ns";
import { growPath } from "batching/grow";
import { weakenPath } from "batching/weaken";
import { hackPath } from "batching/hack";
import { prepareHostPath } from "/batching/prepareHost";

import { findBestTarget, getAllServers } from "/shared/utils";
import { Game } from "/lib/game";

export const hackingDaemonPath = "/batching/hackingDaemon.js";

export async function main(ns: NS): Promise<void> {

  const game = new Game(ns)
  await game.logging.initLogging()
  ns.disableLog("ALL");

  const servers = getAllServers(ns);

  killPrepScripts(game);
  await waitForBatchedHackToFinish(game);

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
        {threads: Math.floor(ramAvalible / ns.getScriptRam(prepareHostPath)), temporary:true, },
        target,
      );
    return 0;
  });
  await waitForPids(prepPid, game);

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
        game.ns.getServerMoneyAvailable(target) / ns.getServerMaxMoney(target) < 0.9
      ) {
        await waitForBatchedHackToFinish(game);
        //restart
        game.ns.spawn(hackingDaemonPath);
      }
    }
    const scheduleWorked = await ScheduleHackEvent(
      game,
      event,
      weak_time,
      hack_time,
      grow_time,
      startTime,
      depth,
      period,
      t0,
      target,
    );
    if (!scheduleWorked) {
      game.logging.error(`Unable to schedule batch task`, true);
      await game.ns.asleep((event % 120) * 1000);
    } else {
      event++;
    }
  }

  game.logging.info(`length of cycle: ${period}`);
  game.logging.info(`Number of cycles needed: ${depth}`);
}

async function waitForBatchedHackToFinish(game:Game) {

  game.logging.info(`waiting for current hacking threads to finish.`);
  const pids = getAllServers(game.ns)
    .map((server) => {
      return game.ns.ps(server);
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
  await waitForPids(pids, game);
}

function killPrepScripts(game:Game) {
  game.logging.info(`Killing any preparation scripts.`);
  getAllServers(game.ns)
    .map((server) => {
      return game.ns.ps(server);
    })
    .reduce((prev: ProcessInfo[], curr: ProcessInfo[]) => {
      return prev.concat(...curr);
    }, [] as ProcessInfo[])
    .filter((proc) => {
      return proc.filename === prepareHostPath;
    })
    .forEach((proc) => {
      game.ns.kill(proc.pid);
    });
}

async function waitForPids(pids: number[],game:Game) {
  do {
    const finished = pids.filter((pid) => pid === 0 || !game.ns.isRunning(pid, ""));
    finished.forEach((pid) => pids.splice(pids.indexOf(pid), 1));
    game.logging.info(`${pids.length} processes left`);
    if (pids.length > 0) await game.ns.asleep(30 * 1000);
  } while (pids.length > 0);
}

async function ScheduleHackEvent(
  game: Game,
  event: number,
  weak_time: number,
  hack_time: number,
  grow_time: number,
  startTime: number,
  depth: number,
  period: number,
  t0: number,
  target: string,
): Promise<boolean> {

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
    game.logging.error(`Wait time negative. restarting script.`, true);
    await game.ns.asleep(weak_time);
    game.ns.spawn(hackingDaemonPath, 1);
  }
  game.logging.info(
    `{"name":"${event_script}-${event}", "startTime":"${new Date(script_start).toISOString()}", "duration":${Math.floor(event_time / 1000)}}`,
  );
  game.logging.info(
    `${event_script}: To Complete ${new Date(script_start + event_time).toISOString()}`,
  );
  return runTask(game, event_script, target, script_start);
}

async function runTask(
  game: Game,
  script: string,
  ...args: (string | number | boolean)[]
): Promise<boolean> {
  const servers = getAllServers(game.ns);
  //find a server with enough free memory to run the script.
  const scriptMem = game.ns.getScriptRam(script);
  const candidateServers = servers.filter((server) => {
    const serverInfo = game.ns.getServer(server);
    const memFree = serverInfo.maxRam - serverInfo.ramUsed;
    return (
      (serverInfo.backdoorInstalled || serverInfo.purchasedByPlayer) &&
      memFree > scriptMem
    );
  });
  if (candidateServers.length === 0) return false;
  await game.ns.scp(script, candidateServers[0]);
  const pid = game.ns.exec(script, candidateServers[0], {threads: 1, temporary: true}, ...args);
  if (pid === 0) {
    game.logging.error(`Failed to run ${script} on ${candidateServers[0]}`);
    return false;
  }
  game.logging.info(`Scheduled ${script} to run on ${candidateServers[0]}`);
  return true;
}
