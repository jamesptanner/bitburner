import { NS } from '@ns'
import { walk } from './utils';

export async function main(ns: NS): Promise<void> {
    //
    const parent = ns.args?.[0] || "home";
    if (typeof parent === "string") {
        const toBackdoor: string[] = []
        await walk(ns,parent,backdoor,toBackdoor);
        await ns.write("toBackdoor.txt",JSON.stringify(toBackdoor),"w");
    }

}

async function backdoor(ns: NS, currentHost: string | undefined, toBackdoor: string[]) :Promise<boolean> {
    const serverInfo = ns.getServer(currentHost);
    if (!serverInfo.backdoorInstalled && currentHost && currentHost) {
        ns.tprintf(`💣 ${currentHost}`);
        const targethacklevel = ns.getServerRequiredHackingLevel(currentHost);
        if (targethacklevel > ns.getHackingLevel()) {
            ns.tprintf(`INFO not able to hack host: ${currentHost}(${targethacklevel})`);
        }
        else {
            if (!serverInfo.purchasedByPlayer) {
                ns.exec("infiltrate.js", "home", 1, currentHost);
                toBackdoor.push(currentHost);
            }
        }
    }
    else if (serverInfo.backdoorInstalled && currentHost) {
        await ns.scp(["HGW.js", "hackHost.js"], currentHost);
        const memReq = ns.getScriptRam("hackHost.js");
        const avalibleRam = serverInfo.maxRam - serverInfo.ramUsed;
        ns.tprintf(`Mem: avalible:${avalibleRam}, total:${serverInfo.maxRam}, needed:${memReq} threads=${Math.max(1, Math.floor(avalibleRam / memReq) - 1)}`);
        if (ns.exec("hackHost.js", currentHost, Math.max(1, Math.floor(avalibleRam / memReq) - 1), currentHost) == 0) {
            ns.tprintf(`failed to launch script on ${currentHost}`);
        }
    }
    return true;
}
