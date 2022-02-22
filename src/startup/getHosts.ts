import { NS } from '@ns'
import { cacheAllServers } from '/utils/utils';

export const getHostsPath ="/startup/getHosts.js";

export async function main(ns : NS) : Promise<void> {
    await cacheAllServers(ns)
}