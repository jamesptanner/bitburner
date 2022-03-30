const scripts = new Map([
    ["AutoLink.exe", 25],
    ["BruteSSH.exe", 50],
    ["ServerProfiler.exe", 75],
    ["DeepscanV1.exe", 75],
    ["FTPCrack.exe", 100],
    ["relaySMTP.exe", 250],
    ["DeepscanV2.exe", 400],
    ["HTTPWorm.exe", 500],
    ["SQLInject.exe", 750],
    ["Formulas.exe", 1000],
]);

const getHostsPath = "/startup/getHosts.js";

const buyScriptsPath = "/cron/buyScripts.js";
async function main(ns) {
    const player = ns.getPlayer();
    if (!player.tor) {
        if (!ns.purchaseTor()) {
            ns.printf(`not enough money to buy tor router`);
            ns.exit();
        }
        ns.run(getHostsPath);
    }
    for (const scriptInfo of scripts) {
        const script = scriptInfo[0];
        if (!ns.fileExists(script)) {
            if (!ns.purchaseProgram(script)) {
                ns.printf(`not enough money to buy ${script}`);
            }
        }
    }
}

export { buyScriptsPath, main };
