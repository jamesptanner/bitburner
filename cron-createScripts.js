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

async function main(ns) {
    const player = ns.getPlayer();
    for (const iterator of scripts) {
        const script = iterator[0];
        const cost = iterator[1];
        if (!ns.fileExists(script) && player.hacking >= cost) {
            // ns.tprintf(`INFO: You should work on new script: ${script}`);
            if (!ns.singularity.isBusy() || ns.getPlayer().workType.includes('program')) {
                ns.printf(`INFO: working on new script ${script}`);
                ns.singularity.createProgram(script, true);
            }
            if (!ns.singularity.isFocused()) {
                ns.printf(`focusing on current work. ${ns.getPlayer().workType}`);
                ns.singularity.setFocus(true);
            }
        }
    }
}

export { main };
