import { NS } from '@ns'
import { getNumberOfTools, hasFTP, hasHTTP, hasSSH, hasSMTP, hasSQL } from '/shared/HGW';

export const infiltratePath = "/hosts/infiltrate.js";

const infiltrate = function (ns:NS, host:string) {
    const targetHackLevel = ns.getServerRequiredHackingLevel(host)
            if (targetHackLevel > ns.getHackingLevel()) {
                ns.tprintf(`WARN not able to hack host: ${host}(${targetHackLevel})`)
                return
            }
            const server = ns.getServer(host)
            if (server.openPortCount < server.numOpenPortsRequired) {
                if (server.numOpenPortsRequired <= getNumberOfTools(ns)) {
                    if (!server.ftpPortOpen && hasFTP(ns)) {
                        ns.ftpcrack(host)
                    }
                    if (!server.httpPortOpen && hasHTTP(ns)) {
                        ns.httpworm(host)
                    }
                    if (!server.sshPortOpen && hasSSH(ns)) {
                        ns.brutessh(host)
                    }
                    if (!server.smtpPortOpen && hasSMTP(ns)) {
                        ns.relaysmtp(host)
                    }
                    if (!server.sqlPortOpen && hasSQL(ns)) {
                        ns.sqlinject(host)
                    }
                }
                else {
                    ns.tprintf(`WARN not enough tools to hack host: ${host}`)
                    return;
                }
            }
            ns.tprintf(`INFO nuking host: ${host}`)
            ns.nuke(host);
            ns.tprintf(`INFO host ready to backdoor: ${host}`)
}


export async function main(ns: NS): Promise<void> {
    if (ns.args.length == 1) {
        const target = ns.args[0];
        ns.tprintf(`INFO infiltrating target: ${target}`)
        if (typeof target === 'string') {
            infiltrate(ns,target)
        }
    }
    else {
        const targets: Array<string> = JSON.parse(ns.read("toInfiltrate.txt"))
        targets.forEach(target => {
            ns.tprintf(`INFO infiltrating target: ${target}`)
            infiltrate(ns,target)
        })
    }
}