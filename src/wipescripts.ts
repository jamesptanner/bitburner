import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    ns.ls("home",".js").forEach(js => ns.rm(js))
}