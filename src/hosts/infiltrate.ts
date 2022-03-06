import { NS } from '@ns'
import { getNumberOfTools, hasFTP, hasHTTP, hasSSH, hasSMTP, hasSQL } from '/shared/HGW';

export const infiltratePath ="/hosts/infiltrate.js";

export async function main(ns: NS): Promise<void> {
    const target = ns.args[0];
    ns.tprintf(`INFO infiltrating target: ${target}`)
    if (typeof target === 'string') {
        const targetHackLevel = ns.getServerRequiredHackingLevel(target)
        if (targetHackLevel > ns.getHackingLevel()) {
            ns.tprintf(`WARN not able to hack host: ${target}(${targetHackLevel})`)
            return
        }
        const server = ns.getServer(target)
        if (server.openPortCount < server.numOpenPortsRequired) {
            if (server.numOpenPortsRequired <= getNumberOfTools(ns)) {
                if (!server.ftpPortOpen && hasFTP(ns)) {
                    ns.ftpcrack(target)
                }
                if (!server.httpPortOpen && hasHTTP(ns)) {
                    ns.httpworm(target)
                }
                if (!server.sshPortOpen && hasSSH(ns)) {
                    ns.brutessh(target)
                }
                if (!server.smtpPortOpen && hasSMTP(ns)) {
                    ns.relaysmtp(target)
                }
                if (!server.sqlPortOpen && hasSQL(ns)) {
                    ns.sqlinject(target)
                }
            }
            else {
                ns.tprintf(`WARN not enough tools to hack host: ${target}`)
                return;
            }
        }
        ns.tprintf(`INFO nuking host: ${target}`)
        ns.nuke(target);
        ns.tprintf(`INFO installing backdoor: ${target}`)
        //await ns.installBackdoor()
        ns.tprintf(`INFO host ready: ${target}`)

    }
}