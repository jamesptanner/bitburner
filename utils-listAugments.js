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

const factions = [
    "CyberSec",
    "Tian Di Hui",
    "Netburners",
    "Sector-12",
    "Chongqing",
    "New Tokyo",
    "Ishima",
    "Aevum",
    "Volhaven",
    "NiteSec",
    "The Black Hand",
    "BitRunners",
    "ECorp",
    "MegaCorp",
    "KuaiGong International",
    "Four Sigma",
    "NWO",
    "Blade Industries",
    "OmniTek Incorporated",
    "Bachman & Associates",
    "Clarke Incorporated",
    "Fulcrum Secret Technologies",
    "Slum Snakes",
    "Tetrads",
    // "Silhouette",                //crime faction not interested in handling yet.
    // "Speakers for the Dead",     //crime faction not interested in handling yet.
    // "The Dark Army",             //crime faction not interested in handling yet.
    // "The Syndicate",             //crime faction not interested in handling yet.
    "The Covenant",
    "Daedalus",
    "Illuminati",
    // "Bladeburners",              //not sure who these are yet.
    // "Church of the Machine God", //not sure who these are yet.
];
const getAugmentsAvailableFromFaction = function (ns, faction) {
    return ns.getAugmentationsFromFaction(faction).filter(augment => {
        return ns.getOwnedAugmentations(true).indexOf(augment) == -1;
    });
};

const listAugmentsPath = "/utils/listAugments.js";
async function main(ns) {
    initLogging(ns);
    log(Level.Info, `Getting list  of augments`);
    factions.forEach(faction => {
        const augments = getAugmentsAvailableFromFaction(ns, faction);
        if (augments.length > 0) {
            log(Level.Info, `faction: ${faction}, augments: [${augments}]`);
        }
    });
}

export { listAugmentsPath, main };
