const getHostsPath = "/startup/getHosts.js";

const purchasePath = "/servers/purchase.js";
async function main(ns) {
    const [name, level] = ns.args;
    if (typeof name == 'string' && typeof level == 'number') {
        const size = 2 << level;
        const newHost = ns.purchaseServer(name, size);
        if (newHost === "") {
            ns.toast("Failed to purchase server", "error");
        }
        else {
            ns.toast(`purchased server ${newHost} size: ${size}GB`);
            ns.spawn(getHostsPath);
        }
    }
    else {
        ns.toast(`Usage: ${purchasePath} name size`);
    }
}

export { main, purchasePath };
