function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}

const killscriptPath = "/utils/killscript.js";
async function main(ns) {
    const target = ns.args[0] || "";
    ns.tprintf(`INFO killing script: ${target}`);
    if (typeof target === 'string') {
        getAllServers(ns).forEach(host => {
            ns.ps(host).filter(x => target === "" || x.filename.indexOf(target) > -1).forEach(x => {
                ns.kill(x.pid);
            });
        });
        ns.tprintf(`INFO: done killing all instances of ${target}`);
    }
}

export { killscriptPath, main };
