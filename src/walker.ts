import { NS } from '@ns'
import { parentPort } from 'worker_threads';

export async function main(ns: NS): Promise<void> {
    //
    const parent = ns.args?.[0] || "home";
    const alreadyScanned = [];
    if (typeof parent === "string") {
        const hosts = ns.scan(parent);
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

                ns.exec("infiltrate.js", "home",1,currentHost);
            }
            alreadyScanned.push(currentHost);
            await ns.sleep(1000);
        }
    }

}