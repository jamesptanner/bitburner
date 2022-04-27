const makeTable = function (ns, headers, data, padding = 1) {
    const getLineLength = function (minColWidths, padding) {
        //text length + padding each side of text + len(entries)+ seperators
        return minColWidths.reduce((p, n) => { return p + n + 2 * padding; }) + minColWidths.length + 3;
    };
    const getMinColWidth = function (rows, padding) {
        return rows.map(row => { return row.length; }).reduce((p, n) => {
            return Math.max(p, n + (padding * 2));
        });
    };
    const makeRowSplit = function (length) {
        return '-'.repeat(length) + '\n';
    };
    const padCell = function (content, width) {
        const paddingCells = width - content.length;
        return `${' '.repeat(Math.floor(paddingCells / 2))}${content}${' '.repeat(Math.ceil(paddingCells / 2))}`;
    };
    const makeRow = function (values, widths, padding) {
        const paddedCells = values.map((v, i) => { return `${' '.repeat(padding)}${padCell(v, widths[i])}${' '.repeat(padding)}`; });
        return `|${paddedCells.join('|')}|\n`;
    };
    const extractColumnValues = function (data, column) {
        return data.map(r => { return r[column]; });
    };
    const widths = headers.map((v, i) => { return getMinColWidth([v, ...extractColumnValues(data, i)], padding); });
    const lineLength = getLineLength(widths, padding);
    const headerRow = makeRow(headers, widths, padding);
    const seperator = makeRowSplit(lineLength);
    const dataRows = data.map(d => { return makeRow(d, widths, padding); });
    const joinedRows = dataRows.join(`${seperator}`);
    ns.printf(`${seperator}${headerRow}${seperator}${joinedRows}${seperator}`);
};

function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}

const hackingDaemonPath = "/batching/hackingDaemon.js";
async function main(ns) {
    ns.disableLog('ALL');
    ns.clearLog();
    ns.tail();
    const servers = getAllServers(ns);
    const data = servers.filter(s => { return ns.getServerMaxMoney(s) > 0; })
        .sort((a, b) => { return ns.getServerMaxMoney(b) - ns.getServerMaxMoney(a); })
        .map(s => {
        const { period, depth } = calculateBatchingProfile(ns, s);
        return [s, `${ns.nFormat(ns.getServerMaxMoney(s), '($0.000a)')}`, `${ns.getServerMinSecurityLevel(s)}`, ns.tFormat(ns.getHackTime(s), true), ns.tFormat(ns.getWeakenTime(s), true), ns.tFormat(ns.getGrowTime(s), true), `${ns.tFormat(period, true)}`, `${depth}`];
    });
    const headers = ['server', 'max money', 'min security', 'hack', 'weaken', 'growth', 'period', 'loops'];
    makeTable(ns, headers, data);
}
function calculateBatchingProfile(ns, target) {
    const hack_time = ns.getHackTime(target);
    const weak_time = ns.getWeakenTime(target);
    const grow_time = ns.getGrowTime(target);
    const t0 = 1000;
    let period = 0;
    let depth = 0;
    const kW_max = Math.floor(1 + (weak_time - 4 * t0) / (8 * t0));
    schedule: for (let kW = kW_max; kW >= 1; --kW) {
        const t_min_W = (weak_time + 4 * t0) / kW;
        const t_max_W = (weak_time - 4 * t0) / (kW - 1);
        const kG_min = Math.ceil(Math.max((kW - 1) * 0.8, 1));
        const kG_max = Math.floor(1 + kW * 0.8);
        for (let kG = kG_max; kG >= kG_min; --kG) {
            const t_min_G = (grow_time + 3 * t0) / kG;
            const t_max_G = (grow_time - 3 * t0) / (kG - 1);
            const kH_min = Math.ceil(Math.max((kW - 1) * 0.25, (kG - 1) * 0.3125, 1));
            const kH_max = Math.floor(Math.min(1 + kW * 0.25, 1 + kG * 0.3125));
            for (let kH = kH_max; kH >= kH_min; --kH) {
                const t_min_H = (hack_time + 5 * t0) / kH;
                const t_max_H = (hack_time - 1 * t0) / (kH - 1);
                const t_min = Math.max(t_min_H, t_min_G, t_min_W);
                const t_max = Math.min(t_max_H, t_max_G, t_max_W);
                if (t_min <= t_max) {
                    period = t_min;
                    depth = kW;
                    break schedule;
                }
            }
        }
    }
    return { period, depth };
}

export { hackingDaemonPath, main };
