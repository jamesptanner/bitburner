const prepareHostPath = "/batching/prepareHost.js";

function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}
const findBestTarget = function (ns) {
    let maxFunds = 0;
    let bestServer = "";
    getAllServers(ns).forEach(server => {
        const serverDetails = ns.getServer(server);
        if (serverDetails.backdoorInstalled && serverDetails.moneyMax > maxFunds) {
            bestServer = server;
            maxFunds = serverDetails.moneyMax;
        }
    });
    return bestServer;
};

const weakenPath = "/batching/weaken.js";

const hackPath = "/batching/hack.js";

const growPath = "/batching/grow.js";

var Level;
(function (Level) {
    Level[Level["Error"] = 0] = "Error";
    Level[Level["Warning"] = 1] = "Warning";
    Level[Level["Info"] = 2] = "Info";
    Level[Level["success"] = 3] = "success";
})(Level || (Level = {}));
class LoggingPayload {
    host;
    script;
    trace;
    timestamp;
    payload;
    constructor(host, script, trace, payload) {
        if (host)
            this.host = host;
        if (script)
            this.script = script;
        if (trace)
            this.trace = trace;
        if (payload)
            this.payload = payload;
        this.timestamp = Date.now() * 1000000;
    }
    static fromJSON(d) {
        return Object.assign(new LoggingPayload(), JSON.parse(d));
    }
}
//from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid.
//cant import crypto so this should do.
//TODO keep an eye out for something better.
function generateUUID() {
    let d = new Date().getTime(); //Timestamp
    let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16; //random number between 0 and 16
        if (d > 0) { //Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        }
        else { //Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
const LOGGING_PORT = 1;
const loggingTrace = generateUUID();
let n;
let portHandle;
const initLogging = function (ns) {
    n = ns;
    portHandle = ns.getPortHandle(LOGGING_PORT);
};
const levelToString = function (level) {
    switch (level) {
        case Level.Error:
            return "Error";
        case Level.Info:
            return "Info";
        case Level.Warning:
            return "Warn";
        case Level.success:
            return "Success";
    }
    return "";
};
const levelToToast = function (level) {
    switch (level) {
        case Level.Error:
            return "error";
        case Level.Info:
            return "info";
        case Level.Warning:
            return "warning";
        case Level.success:
            return "success";
    }
    return "";
};
const log = function (level, msg, toast) {
    if (toast) {
        n.toast(`${levelToString(level)}: ${msg}`, levelToToast(level));
    }
    n.print(`${levelToString(level)}: ${msg}`);
    const logPayload = new LoggingPayload(n.getHostname(), n.getScriptName(), loggingTrace, {
        level: level,
        message: msg,
    });
    let attempts = 0;
    while (!portHandle.tryWrite(JSON.stringify(logPayload)) && attempts < 3) {
        attempts++;
    }
};

const hackingDaemonPath = "/batching/hackingDaemon.js";
async function main(ns) {
    ns.disableLog('ALL');
    initLogging(ns);
    const target = findBestTarget(ns);
    const servers = getAllServers(ns);
    await waitForBatchedHackToFinish(ns);
    // prepare the server for attack. max mon, min sec.
    for (const server of servers) {
        await ns.scp([prepareHostPath, weakenPath, growPath, hackPath], server);
    }
    //throw everything we have at it and wait for the threads to finish.
    const prepPid = servers.map(server => {
        const ramAvalible = ns.getServer(server).maxRam - ns.getServer(server).ramUsed;
        if (ramAvalible / ns.getScriptRam(prepareHostPath) > 1)
            return ns.exec(prepareHostPath, server, Math.floor(ramAvalible / ns.getScriptRam(prepareHostPath)), target);
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
    while (true) {
        if (event % 120 == 0) {
            await ns.sleep(60 * 1000);
            // //check we are hacking the right target 
            const newTarget = findBestTarget(ns);
            if (newTarget !== target) {
                await waitForBatchedHackToFinish(ns);
                //restart
                ns.spawn(hackingDaemonPath);
            }
        }
        const scheduleWorked = await ScheduleHackEvent(event, weak_time, hack_time, grow_time, startTime, depth, period, t0, ns, target);
        if (!scheduleWorked) {
            ns.toast(`Unable to schedule batch task`, "error", null);
            await ns.sleep((event % 120) * 1000);
        }
        else {
            event++;
        }
    }
    ns.printf(`length of cycle: ${period}`);
    ns.printf(`Number of cycles needed: ${depth}`);
}
async function waitForBatchedHackToFinish(ns) {
    ns.printf(`waiting for current hacking threads to finish.`);
    const pids = getAllServers(ns).map(server => {
        return ns.ps(server);
    })
        .reduce((prev, curr) => {
        return prev.concat(...curr);
    }, [])
        .filter(proc => {
        return proc.filename == weakenPath || proc.filename == growPath || proc.filename === hackPath;
    })
        .map(procInfo => procInfo.pid);
    await waitForPids(pids, ns);
}
async function waitForPids(pids, ns) {
    do {
        const finished = pids.filter(pid => pid === 0 || !ns.isRunning(pid, ""));
        finished.forEach(pid => pids.splice(pids.indexOf(pid), 1));
        ns.printf(`${pids.length} processes left`);
        if (pids.length > 0)
            await ns.sleep(30 * 1000);
    } while (pids.length > 0);
}
async function ScheduleHackEvent(event, weak_time, hack_time, grow_time, startTime, depth, period, t0, ns, target) {
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
    const script_start = startTime + (depth * period) - (event * t0 * -1) - event_time;
    if (script_start < 0) {
        ns.toast(`Wait time negative. restarting script.`, "error", null);
        await ns.sleep(weak_time);
        ns.spawn(hackingDaemonPath, 1);
    }
    log(Level.Info, `{"name":"${event_script}-${event}", "startTime":"${new Date(script_start).toISOString()}", "duration":${Math.floor(event_time / 1000)}}`);
    ns.printf(`${event_script}: To Complete ${new Date(script_start + event_time).toISOString()}`);
    return runTask(ns, event_script, target, script_start);
}
async function runTask(ns, script, ...args) {
    const servers = getAllServers(ns);
    //find a server with enough free memory to run the script.
    const scriptMem = ns.getScriptRam(script);
    const candidateServers = servers.filter(server => {
        const serverInfo = ns.getServer(server);
        const memFree = serverInfo.maxRam - serverInfo.ramUsed;
        return (serverInfo.backdoorInstalled || serverInfo.purchasedByPlayer) && memFree > scriptMem;
    });
    if (candidateServers.length == 0)
        return false;
    await ns.scp(script, candidateServers[0]);
    const pid = ns.exec(script, candidateServers[0], 1, ...args);
    if (pid === 0) {
        ns.printf(`Failed to run ${script} on ${candidateServers[0]}`);
        return false;
    }
    ns.printf(`Scheduled ${script} to run on ${candidateServers[0]}`);
    return true;
}

export { hackingDaemonPath, main };
