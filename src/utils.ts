import { NS } from "@ns";


export async function growServer(ns: NS, target: string) {
    await ns.grow(target, { threads: 2 })
}

export async function weakenServer(ns: NS, target: string) {
    await ns.weaken(target, { threads: 2 })
}

export async function attack(ns: NS, target: string) {
    await ns.hack(target, { threads: 2 })

}