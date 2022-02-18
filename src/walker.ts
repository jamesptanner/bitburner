import { NS } from '@ns'
import { parentPort } from 'worker_threads';

export async function main(ns: NS): Promise<void> {
    //
    const parent = ns.args?.[0] || "home";
    const alreadyScanned = [];
    if (typeof parent === "string") {
        const hosts = ns.scan(parent);
        const toBackdoor = []
        while (hosts.length > 0){
            const currentHost = hosts.pop();
            if(alreadyScanned.indexOf(currentHost) != -1){
                continue;
            }
            ns.tprintf(`Scanning ${currentHost}`);
            hosts.push(...ns.scan(currentHost));
            const serverInfo = ns.getServer(currentHost)
            if(!serverInfo.backdoorInstalled && currentHost && currentHost){
                ns.tprintf(`💣 ${currentHost}`);
                const targethacklevel = ns.getServerRequiredHackingLevel(currentHost)
                if (targethacklevel > ns.getHackingLevel()) {
                    ns.tprintf(`INFO not able to hack host: ${currentHost}(${targethacklevel})`)
                }
                else {
                    if(!serverInfo.purchasedByPlayer){
                        ns.exec("infiltrate.js", "home",1,currentHost);
                        toBackdoor.push(currentHost)
                    }
                }
            }
            else if(serverInfo.backdoorInstalled && currentHost ){
                await ns.scp(["HGW.js","hackHost.js"],currentHost);
                const memReq = ns.getScriptRam("hackHost.js");
                const avalibleRam = serverInfo.maxRam -serverInfo.ramUsed;
                ns.tprintf(`Mem: avalible:${avalibleRam}, total:${serverInfo.maxRam}, needed:${memReq} threads=${Math.max(1,Math.floor(avalibleRam/memReq)-1)}`)
                if(ns.exec("hackHost.js",currentHost,Math.max(1,Math.floor(avalibleRam/memReq)-1),currentHost)==0){
                    ns.tprintf(`failed to launch script on ${currentHost}`)
                }
            }
            alreadyScanned.push(currentHost);
            await ns.sleep(1000);
        }
        await ns.write("toBackdoor.txt",JSON.stringify(toBackdoor),"w");
    }

}