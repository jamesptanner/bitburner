import { NS } from '@ns'
import { walk } from '/utils/utils';
import { infiltratePath} from '/hosts/infiltrate';
import { HGWPath } from '/utils/HGW';
import {hackHostPath} from '/hosts/hackHost';

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
        const targetHackLevel = ns.getServerRequiredHackingLevel(currentHost);
        if (targetHackLevel > ns.getHackingLevel()) {
            // ns.tprintf(`INFO not able to hack host: ${currentHost}(${targetHackLevel})`);
        }
        else {
            ns.tprintf(`INFO 💣 ${currentHost}`);

            if (!serverInfo.purchasedByPlayer) {
                ns.exec(infiltratePath, "home", 1, currentHost);
                toBackdoor.push(currentHost);
            }
        }
    }
    else if (serverInfo.backdoorInstalled && currentHost && !scriptIsRunning(ns,currentHost,hackHostPath)) {
        await ns.scp([HGWPath, hackHostPath], currentHost);
        const memReq = ns.getScriptRam(hackHostPath);
        const availableRam = serverInfo.maxRam - serverInfo.ramUsed;
        ns.tprintf(`Mem: available:${availableRam}, total:${serverInfo.maxRam}, needed:${memReq} threads=${Math.max(1, Math.floor(availableRam / memReq) - 1)}`);
        if (ns.exec(hackHostPath, currentHost, Math.max(1, Math.floor(availableRam / memReq) - 1), currentHost) == 0) {
            ns.tprintf(`failed to launch script on ${currentHost}`);
        }
    }
    return true;
}

const scriptIsRunning = function(ns:NS, host: string, script: string): boolean{
    return ns.ps(host).filter(process => process.filename == script).length > 0;
}