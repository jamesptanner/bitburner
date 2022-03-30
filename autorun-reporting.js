var Level;
(function (Level) {
    Level[Level["Error"] = 0] = "Error";
    Level[Level["Warning"] = 1] = "Warning";
    Level[Level["Info"] = 2] = "Info";
    Level[Level["success"] = 3] = "success";
})(Level || (Level = {}));
class LoggingPayload {
    host;
    script;
    trace;
    timestamp;
    payload;
    constructor(host, script, trace, payload) {
        if (host)
            this.host = host;
        if (script)
            this.script = script;
        if (trace)
            this.trace = trace;
        if (payload)
            this.payload = payload;
        this.timestamp = Date.now() * 1000000;
    }
    static fromJSON(d) {
        return Object.assign(new LoggingPayload(), JSON.parse(d));
    }
}
//from https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid.
//cant import crypto so this should do.
//TODO keep an eye out for something better.
function generateUUID() {
    let d = new Date().getTime(); //Timestamp
    let d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0; //Time in microseconds since page-load or 0 if unsupported
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        let r = Math.random() * 16; //random number between 0 and 16
        if (d > 0) { //Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        }
        else { //Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}
const LOGGING_PORT = 1;
const loggingTrace = generateUUID();
let n;
let portHandle;
const initLogging = function (ns) {
    n = ns;
    portHandle = ns.getPortHandle(LOGGING_PORT);
};
const levelToString = function (level) {
    switch (level) {
        case Level.Error:
            return "Error";
        case Level.Info:
            return "Info";
        case Level.Warning:
            return "Warn";
        case Level.success:
            return "Success";
    }
    return "";
};
const levelToToast = function (level) {
    switch (level) {
        case Level.Error:
            return "error";
        case Level.Info:
            return "info";
        case Level.Warning:
            return "warning";
        case Level.success:
            return "success";
    }
    return "";
};
const log = function (level, msg, toast) {
    if (toast) {
        n.toast(`${levelToString(level)}: ${msg}`, levelToToast(level));
    }
    n.print(`${levelToString(level)}: ${msg}`);
    const logPayload = new LoggingPayload(n.getHostname(), n.getScriptName(), loggingTrace, {
        level: level,
        message: msg,
    });
    let attempts = 0;
    while (!portHandle.tryWrite(JSON.stringify(logPayload)) && attempts < 3) {
        attempts++;
    }
};
const sendMetric = function (key, value) {
    const logPayload = new LoggingPayload(n.getHostname(), n.getScriptName(), loggingTrace, {
        key: key,
        value: value
    });
    let attempts = 0;
    while (!portHandle.tryWrite(JSON.stringify(logPayload)) && attempts < 3) {
        attempts++;
    }
};

function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}

const reportingPath = "/autorun/reporting.js";
async function main(ns) {
    initLogging(ns);
    while (true) {
        const player = ns.getPlayer();
        sendMetric("player.money", player.money);
        sendMetric("player.stats.level.hack", player.hacking);
        sendMetric("player.stats.level.strength", player.strength);
        sendMetric("player.stats.level.defense", player.defense);
        sendMetric("player.stats.level.dexterity", player.dexterity);
        sendMetric("player.stats.level.agility", player.agility);
        sendMetric("player.stats.level.charisma", player.charisma);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore property is intentionally undocumented.
        sendMetric("player.stats.level.karma", ns.heart.break());
        sendMetric("player.bitnode", player.bitNodeN);
        getAllServers(ns).concat('home').filter(server => {
            const serverInfo = ns.getServer(server);
            return serverInfo.backdoorInstalled || serverInfo.purchasedByPlayer;
        })
            .forEach(server => {
            log(Level.Info, `server:${server} ramused:${ns.getServerUsedRam(server)} rammax:${ns.getServerMaxRam(server)}`);
        });
        await ns.sleep(5000);
    }
}

export { main, reportingPath };
