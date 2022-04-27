import { NS } from '@ns';
import { hackHostPath } from "/hosts/hackHost";
import { asString, getAllServers } from "/shared/utils";

export async function main(ns : NS) : Promise<void> {
    const oldTarget = asString(ns.args[0])
    const target = findBestTarget(ns)
    const serverInfo = ns.getServer(oldTarget);

    ns.tprintf(`INFO: ${oldTarget} attacking ${target} instead.`)
    const memReq = ns.getScriptRam(hackHostPath);
    const availableRam = serverInfo.maxRam - serverInfo.ramUsed;
    if(ns.exec(hackHostPath,oldTarget,Math.floor(availableRam / memReq),"--host",target) ==0 ){
        ns.tprintf(`failed to launch script on ${oldTarget}`);
    }
}

const findBestTarget = function(ns:NS): string{
    let maxFunds = 0;
    let bestServer ="";
    getAllServers(ns).forEach(server =>{
        const serverDetails = ns.getServer(server)
        if(serverDetails.backdoorInstalled && serverDetails.moneyMax > maxFunds){
            bestServer = server;
            maxFunds = serverDetails.moneyMax
        }
    })
    return bestServer
}