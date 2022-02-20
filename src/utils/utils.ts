import { NS } from '@ns';

export const utilsPath = "/utils/utils.js";

export function asString(val: (string | number | boolean)): string{
    if (typeof val === "string") return val;
    return String(val);
}
export function asNumber(val: (string | number | boolean)): number{
    if (typeof val === "number") return val;
    return NaN;
}

export function asBoolean(val: (string | number | boolean)): boolean{
    if (typeof val === "boolean") return val;
    return false;
}

export async function walk(ns: NS, start: string, func: (ns: NS, host: string | undefined, ...args: any[]) => Promise<boolean>, ...args: any[]): Promise<void> {
    const alreadyScanned = [];
    const hosts = ns.scan(start);
    while (hosts.length > 0) {
        const currentHost = hosts.pop();
        if (alreadyScanned.indexOf(currentHost) != -1) {
            continue;
        }
        hosts.push(...ns.scan(currentHost));
        const cont = await func(ns, currentHost, ...args);
        if (!cont)
            break;
        alreadyScanned.push(currentHost);
    }
}

export function getAllServers(ns:NS): string[]{
    const alreadyScanned = [];
    const allHosts = ns.scan("home")
    const hosts = ns.scan("home");
    while (hosts.length > 0) {
        const currentHost = hosts.pop();
        if (alreadyScanned.indexOf(currentHost) != -1) {
            continue;
        }
        const scanned = ns.scan(currentHost)
        hosts.push(...scanned);
        allHosts.push(...scanned)
        alreadyScanned.push(currentHost);
    }
    return allHosts.filter((v,i,self) =>{
        return self.indexOf(v) === i;
    })
}