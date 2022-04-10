function createHGWoptions(ns) {
    const defaultHGWOptions = {
        threads: 2
    };
    const process = ns.ps().find(x => x.filename == ns.getScriptName());
    if (process) {
        defaultHGWOptions.threads = process.threads;
    }
    return defaultHGWOptions;
}
async function hackServer(ns, target) {
    const earnings = await ns.hack(target, createHGWoptions(ns));
    ns.toast(`${ns.getHostname()}:🤖 ${target} Earned ${ns.nFormat(earnings, '($0.00a)')}`, earnings > 0 ? "success" : "warning");
}

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

const hackPath = "/batching/hack.js";
async function main(ns) {
    const target = asString(ns.args[0]);
    const startTime = asNumber(ns.args[1]);
    if (typeof target === 'string' && typeof startTime === 'number') {
        await ns.sleep(Math.max(0, startTime - Date.now()));
        ns.print(`INFO 🤖: ${target}. ${(ns.getHackTime(target) / 1000).toFixed(2)}s`);
        await hackServer(ns, target);
    }
}

export { hackPath, main };
