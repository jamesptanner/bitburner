const lowMemPath = "/playmode/lowMem.js";

async function main(ns) {
    if (ns.getServerMaxRam("home") <= 32) {
        ns.tprintf(`low on memory. Working on increasing mem first.`);
        ns.spawn(lowMemPath, 1);
    }
    const startupFiles = ns.ls("home", "/startup/");
    if (startupFiles.length > 0) {
        startupFiles.forEach(file => {
            ns.tprintf(`INFO starting ${file}`);
            ns.exec(file, "home");
        });
    }
    const autorunFiles = ns.ls("home", "/autorun/");
    if (autorunFiles.length > 0) {
        autorunFiles.forEach(file => {
            ns.tprintf(`INFO starting ${file}`);
            ns.exec(file, "home");
        });
    }
}

export { main };
