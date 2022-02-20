import { NS } from '@ns'
import { asString, getAllServers } from '/utils/utils';
import { hackHostPath } from '/hosts/files';

export async function main(ns : NS) : Promise<void> {
    const oldTarget = asString(ns.args[0])
    const target = findBestTarget(ns)
    ns.tprintf(`INFO: ${oldTarget} attacking ${target} instead.`)
    ns.spawn(hackHostPath,1,target)
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