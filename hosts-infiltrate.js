const breachScripts = [
    "BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"
];
function getNumberOfTools(ns) {
    return breachScripts.filter(x => ns.fileExists(x)).length;
}
function hasSSH(ns) {
    return ns.fileExists("BruteSSH.exe");
}
function hasFTP(ns) {
    return ns.fileExists("FTPCrack.exe");
}
function hasSMTP(ns) {
    return ns.fileExists("relaySMTP.exe");
}
function hasHTTP(ns) {
    return ns.fileExists("HTTPWorm.exe");
}
function hasSQL(ns) {
    return ns.fileExists("SQLInject.exe");
}

const infiltratePath = "/hosts/infiltrate.js";
const infiltrate = function (ns, host) {
    const targetHackLevel = ns.getServerRequiredHackingLevel(host);
    if (targetHackLevel > ns.getHackingLevel()) {
        ns.tprintf(`WARN not able to hack host: ${host}(${targetHackLevel})`);
        return;
    }
    const server = ns.getServer(host);
    if (server.openPortCount < server.numOpenPortsRequired) {
        if (server.numOpenPortsRequired <= getNumberOfTools(ns)) {
            if (!server.ftpPortOpen && hasFTP(ns)) {
                ns.ftpcrack(host);
            }
            if (!server.httpPortOpen && hasHTTP(ns)) {
                ns.httpworm(host);
            }
            if (!server.sshPortOpen && hasSSH(ns)) {
                ns.brutessh(host);
            }
            if (!server.smtpPortOpen && hasSMTP(ns)) {
                ns.relaysmtp(host);
            }
            if (!server.sqlPortOpen && hasSQL(ns)) {
                ns.sqlinject(host);
            }
        }
        else {
            ns.tprintf(`WARN not enough tools to hack host: ${host}`);
            return;
        }
    }
    ns.tprintf(`INFO nuking host: ${host}`);
    ns.nuke(host);
    ns.tprintf(`INFO host ready to backdoor: ${host}`);
};
async function main(ns) {
    if (ns.args.length == 1) {
        const target = ns.args[0];
        ns.tprintf(`INFO infiltrating target: ${target}`);
        if (typeof target === 'string') {
            infiltrate(ns, target);
        }
    }
    else {
        const targets = JSON.parse(ns.read("toInfiltrate.txt"));
        targets.forEach(target => {
            ns.tprintf(`INFO infiltrating target: ${target}`);
            infiltrate(ns, target);
        });
    }
}

export { infiltratePath, main };
