import { NS } from '@ns';
import { getAllServers } from '/shared/utils';
import { makeTable } from '/shared/ui';
import { Logging } from '/shared/logging';

export const listServersPath ="/utils/listServers.js";

export async function main(ns : NS) : Promise<void> {
    const logging = new Logging(ns);
    const serverInfo = getAllServers(ns).map(server =>{
        return [server, ns.getServer(server).requiredHackingSkill]
    })
    .sort((a,b)=>{ return (a[1] as number) - (b[1] as number)})
    .reverse()
    .map<string[]>(v =>{return [v[0] as string, `${v[1]}`]})
    ns.tail()
    ns.clearLog()
    logging.info(makeTable(ns,["server","level"],serverInfo)) 
}