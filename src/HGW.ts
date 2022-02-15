import { BasicHGWOptions, NS } from "@ns";

const defaultHGWOptions: BasicHGWOptions =
{
    threads:2
};

export async function growServer(ns: NS, target: string): Promise<void> {
    await ns.grow(target,defaultHGWOptions)
}

export async function weakenServer(ns: NS, target: string): Promise<void> {
    await ns.weaken(target, defaultHGWOptions)
}

export async function attack(ns: NS, target: string): Promise<void> {
    await ns.hack(target, defaultHGWOptions)
}