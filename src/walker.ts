import { NS } from '@ns'

export async function main(ns: NS): Promise<void> {
    //
    const parent = ns.args?.[0] || "home";
    const us = ns.getHostname();
    ns.tprintf(`Running on host: ${us} Parent: ${parent}`);

    if (typeof parent === "string") {
        let hosts = ns.scan();
        hosts = hosts.filter(host => {
            return host != parent;
        })
        for await (const host of hosts) {
            ns.tprintf(`found host ${host} at ${us}`);
            ns.exec("walker.js", host, 1, us);
            const files = ns.ls(host, ".lit|.txt|.script");
            if (files.length > 0) {
                await ns.scp(files, host, "home").catch(e =>{
                    ns.tprintf(`unable to copy files from target: ${e}`)
                });
            }
            await ns.scp("walker.js", "home", host).catch(e => {
                ns.tprintf(`Failed to copy script: ${e}`)
            });
        }
    }

}