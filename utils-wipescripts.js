async function main(ns) {
    ns.ls("home", ".js").forEach(js => ns.rm(js));
}

export { main };
