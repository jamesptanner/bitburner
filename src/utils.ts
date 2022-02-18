import { NS } from '@ns';

export function asString(val: any): string | null{
    if (typeof val === "string") return val;
    return null;
}

export async function walk(ns: NS, start: string, func: (ns: NS, host: string | undefined, ...args: any[]) => Promise<boolean>, ...args: any[]): Promise<void> {
    const alreadyScanned = [];
    const hosts = ns.scan(start);
    while (hosts.length > 0) {
        const currentHost = hosts.pop();
        if (alreadyScanned.indexOf(currentHost) != -1) {
            continue;
        }
        ns.tprintf(`Scanning ${currentHost}`);
        hosts.push(...ns.scan(currentHost));
        const cont = await func(ns, currentHost, ...args);
        if (!cont)
            break;
        alreadyScanned.push(currentHost);
        await ns.sleep(100);
    }
}