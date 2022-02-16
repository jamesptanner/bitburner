import { NS } from '@ns'

const scripts = new Map<string, number>([
    ["AutoLink.exe", 25],
    ["BruteSSH.exe", 50],
    ["ServerProfiler.exe", 75],
    ["DeepscanV1.exe", 75],
    ["FTPCrack.exe", 100],
    ["relaySMTP.exe", 250],
    ["DeepscanV2.exe", 400],
    ["HTTPWorm.exe", 500],
    ["SQLInject.exe", 750],
]);
export async function main(ns: NS): Promise<void> {
    const player = ns.getPlayer();
    while (true) {
        ns.tprintf(`INFO: Checking if we can make any scripts`);
        for (const iterator of scripts) {
            const script = iterator[0];
            const cost = iterator[1];
            if (!ns.fileExists(script) && player.hacking >= cost) {
                if (!ns.isBusy()) {
                    ns.tprintf(`INFO: starting work on new script: ${script}`);
                    //ns.createProgram(script);
                }
            }
        }
        await ns.sleep(5 * 60 * 1000);
    }
}