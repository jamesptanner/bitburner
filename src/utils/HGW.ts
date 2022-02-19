import { BasicHGWOptions, NS } from "@ns";

export const HGWPath ="/utils/HGW.js";

function createHGWoptions(ns: NS, target: string): BasicHGWOptions {
    const defaultHGWOptions: BasicHGWOptions =
    {
        threads:2
    };
    const process = ns.ps().find(x =>x.filename==ns.getScriptName()&& x.args[0]==target);
    if(process){
        defaultHGWOptions.threads = process.threads;
    }
    return defaultHGWOptions;
}
export async function growServer(ns: NS, target: string): Promise<void> {
    await ns.grow(target,createHGWoptions(ns,target))
}

export async function weakenServer(ns: NS, target: string): Promise<void> {
    await ns.weaken(target, createHGWoptions(ns,target))
}

export async function attack(ns: NS, target: string): Promise<void> {
    const earnings = await ns.hack(target, createHGWoptions(ns,target));
    ns.tprintf(`INFO 🐱‍💻: ${target} Earned ${earnings}`)
}

export const scripts = new Map<string, number>([
    ["AutoLink.exe", 25],
    ["BruteSSH.exe", 50],
    ["ServerProfiler.exe", 75],
    ["DeepscanV1.exe", 75],
    ["FTPCrack.exe", 100],
    ["relaySMTP.exe", 250],
    ["DeepscanV2.exe", 400],
    ["HTTPWorm.exe", 500],
    ["SQLInject.exe", 750],
    ["Formulas.exe",1000],
]);

export const breachScripts = [
    "BruteSSH.exe","FTPCrack.exe","relaySMTP.exe","HTTPWorm.exe","SQLInject.exe"
];

export function getNumberOfTools(ns: NS): number {
    return breachScripts.filter(x => ns.fileExists(x)).length
}

export function hasSSH(ns: NS): boolean{
    return ns.fileExists("BruteSSH.exe");
}
export function hasFTP(ns: NS): boolean{
    return ns.fileExists("FTPCrack.exe");
}
export function hasSMTP(ns: NS): boolean{
    return ns.fileExists("relaySMTP.exe");
}
export function hasHTTP(ns: NS): boolean{
    return ns.fileExists("HTTPWorm.exe");
}
export function hasSQL(ns: NS): boolean{
    return ns.fileExists("SQLInject.exe");
}

export function hasFormulas(ns: NS): boolean{
    return ns.fileExists("Formulas.exe");
}