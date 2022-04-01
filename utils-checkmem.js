const checkmemPath = "/utils/checkmem.js";
async function main(ns) {
    ns.disableLog('ALL');
    ns.ls("home", ".js").forEach(script => {
        const totalMem = ns.getServerMaxRam('home');
        const mem = ns.getScriptRam(script);
        const memPercent = mem / totalMem;
        const level = memPercent > 0.5 ? memPercent > 1 ? "ERROR" : "WARN" : "INFO";
        ns.printf(`${level} ${script}: ${mem}GB`);
    });
}

export { checkmemPath, main };
