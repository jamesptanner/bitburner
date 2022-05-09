function createHGWoptions(ns) {
    const defaultHGWOptions = {
        threads: 2
    };
    const process = ns.ps().find(x => x.filename == ns.getScriptName());
    if (process) {
        defaultHGWOptions.threads = process.threads;
    }
    return defaultHGWOptions;
}
async function weakenServer(ns, target) {
    const success = await ns.weaken(target, createHGWoptions(ns));
    ns.toast(`${ns.getHostname()}:😷 ${target}`, success > 0 ? "success" : "warning");
}
async function hackServer(ns, target) {
    const earnings = await ns.hack(target, createHGWoptions(ns));
    ns.toast(`${ns.getHostname()}:🤖 ${target} Earned ${ns.nFormat(earnings, '($0.00a)')}`, earnings > 0 ? "success" : "warning");
}

var Level;
(function (Level) {
    Level[Level["Error"] = 0] = "Error";
    Level[Level["Warning"] = 1] = "Warning";
    Level[Level["Info"] = 2] = "Info";
    Level[Level["success"] = 3] = "success";
})(Level || (Level = {}));
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
generateUUID();
const log = function (level, msg, toast) {
    {
        throw new Error("Logging not initalised");
    }
};
const success = function (msg, toast) {
    log();
};
const info = function (msg, toast) {
    log();
};
const warning = function (msg, toast) {
    log();
};
const error = function (msg, toast) {
    log();
};
const logging = {
    log: log,
    error: error,
    warning: warning,
    success: success,
    info: info
};

async function main(ns) {
    const target = ns.args[0];
    logging.info(`Draining target: ${target}`);
    if (typeof target === 'string') {
        while (true) {
            if (!(ns.getServerSecurityLevel(target) < ns.getServerMinSecurityLevel(target) + 1)) {
                logging.info(`😷: ${target}. ${(ns.getWeakenTime(target) / 1000).toFixed(2)}s`);
                await weakenServer(ns, target);
            }
            else {
                logging.info(`🤖: ${target}. ${(ns.getHackTime(target) / 1000).toFixed(2)}s`);
                await hackServer(ns, target);
            }
        }
    }
}

export { main };
