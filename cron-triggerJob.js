function asString(val) {
    if (typeof val === "string")
        return val;
    return String(val);
}
function asNumber(val) {
    if (typeof val === "number")
        return val;
    return NaN;
}

const triggerJobPath = "/cron/triggerJob.js";
async function main(ns) {
    const args = ns.args;
    let tmp = args.shift();
    if (!tmp) {
        ns.tprintf(`ERROR no interval provided`);
        return;
    }
    const interval = asNumber(tmp);
    tmp = args.shift();
    if (!tmp) {
        ns.tprintf(`ERROR no script provided`);
        return;
    }
    const script = asString(tmp);
    await ns.asleep(Math.random() * interval);
    ns.tprintf(`INFO: setting up cronjob: ${script}`);
    while (interval && script) {
        const pid = ns.run(script, 1, ...args);
        if (pid === 0) {
            ns.print(`failed to start script.`);
        }
        await ns.asleep(interval);
        ns.print(`INFO cronjob triggered.`);
    }
}

export { main, triggerJobPath };
