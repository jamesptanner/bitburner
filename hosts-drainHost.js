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
async function weakenServer(ns, target) {
    const success = await ns.weaken(target, createHGWoptions(ns));
    ns.toast(`${ns.getHostname()}:😷 ${target}`, success > 0 ? "success" : "warning");
}
async function hackServer(ns, target) {
    const earnings = await ns.hack(target, createHGWoptions(ns));
    ns.toast(`${ns.getHostname()}:🤖 ${target} Earned ${ns.nFormat(earnings, '($0.00a)')}`, earnings > 0 ? "success" : "warning");
}

async function main(ns) {
    const target = ns.args[0];
    ns.tprintf(`INFO Draining target: ${target}`);
    if (typeof target === 'string') {
        while (true) {
            if (!(ns.getServerSecurityLevel(target) < ns.getServerMinSecurityLevel(target) + 1)) {
                ns.print(`INFO 😷: ${target}. ${(ns.getWeakenTime(target) / 1000).toFixed(2)}s`);
                await weakenServer(ns, target);
            }
            else {
                ns.print(`INFO 🤖: ${target}. ${(ns.getHackTime(target) / 1000).toFixed(2)}s`);
                await hackServer(ns, target);
            }
        }
    }
}

export { main };
