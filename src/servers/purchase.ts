import { NS } from '@ns'

export const purchasePath = "/servers/purchase.js";

export async function main(ns: NS): Promise<void> {
    const [name, level] = ns.args
    if (typeof name == 'string' && typeof level == 'number') {
        const size = 2 << level;
        const newHost = ns.purchaseServer(name, size)
        if (newHost === "") {
            ns.toast("Failed to purchase server", "error")
        }
        else {
            ns.toast(`purchased server ${newHost} size: ${size}GB`)
        }
    }
    else {
        ns.toast(`Usage: ${purchasePath} name size`)
    }
}