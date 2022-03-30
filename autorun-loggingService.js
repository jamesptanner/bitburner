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
generateUUID();

// import GraphiteClient from 'graphite'
const loggingServicePath = "/autorun/loggingService.js";
class LoggingSettings {
    gameHost;
    loggingHost;
    metricHost;
    constructor(gameHost, loggingHost, metricHost) {
        if (gameHost)
            this.gameHost = gameHost;
        if (loggingHost)
            this.loggingHost = loggingHost;
        if (metricHost)
            this.metricHost = metricHost;
    }
    static fromJSON(d) {
        return Object.assign(new LoggingSettings(), JSON.parse(d));
    }
}
let graphiteUrl;
let graphiteRequest;
const setupGraphite = function (settings) {
    graphiteUrl = `${settings.metricHost}/`;
    graphiteRequest = {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        }
    };
};
const sendTrace = async function (ns, settings, payload) {
    if ("key" in payload.payload) {
        const metricName = `bitburner.${settings.gameHost}.${payload.payload.key}`;
        const request = graphiteRequest;
        request.body = `${metricName} ${payload.payload.value} ${Math.floor(Date.now() / 1000)}\n`;
        const response = await fetch(graphiteUrl, request);
        if (!response.ok) {
            ns.tprint(`ERROR: Failed to send metric to graphite. HTTP code: ${response.status}`);
        }
        else {
            ns.print("Send Successful.");
        }
    }
};
const sendLog = async function (ns, settings, payload) {
    if ("message" in payload.payload) {
        const request = lokiRequest;
        const body = {
            "streams": [
                {
                    "stream": {
                        "trace": payload.trace,
                        "host": payload.host,
                        "script": payload.script,
                        "game": settings.gameHost,
                        "level": payload.payload.level
                    },
                    "values": [
                        [payload.timestamp, payload.payload.message]
                    ]
                }
            ]
        };
        request.body = JSON.stringify(body);
        const response = await fetch(lokiUrl, request);
        if (!response.ok) {
            ns.tprint(`ERROR: Failed to send logging to loki. HTTP code: ${response.status}`);
        }
        else {
            ns.print("Send Successful.");
        }
    }
};
let lokiUrl;
let lokiRequest;
const setupLoki = function (settings) {
    lokiUrl = `${settings.loggingHost}/loki/api/v1/push`;
    lokiRequest = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
};
const loggingSettingsFile = "loggingSettings.txt";
const checkLoggingSettings = async function (ns) {
    const settings = LoggingSettings.fromJSON(ns.read(loggingSettingsFile));
    let saveSettings = false;
    if (!settings.gameHost) {
        saveSettings = true;
        const host = await ns.prompt("Enter Game Identifier", { type: "text" });
        if (typeof host === 'string')
            settings.gameHost = host;
    }
    if (!settings.loggingHost) {
        saveSettings = true;
        const host = await ns.prompt("Enter Logging server host address (http://loki.example.org:3100)", { type: "text" });
        if (typeof host === 'string')
            settings.loggingHost = host;
    }
    if (!settings.metricHost) {
        saveSettings = true;
        const host = await ns.prompt("Enter metric server host address (http://graphite.example.org:2003)", { type: "text" });
        if (typeof host === 'string')
            settings.metricHost = host;
    }
    if (saveSettings) {
        await ns.write(loggingSettingsFile, JSON.stringify(settings), "w");
    }
    return settings;
};
async function main(ns) {
    const port = ns.getPortHandle(LOGGING_PORT);
    const loggingSettings = await checkLoggingSettings(ns);
    setupLoki(loggingSettings);
    setupGraphite(loggingSettings);
    while (true) {
        while (!port.empty()) {
            const portPayload = port.read();
            if (typeof portPayload === 'number') {
                ns.tprint(`Payload unknown type.`);
                ns.exit();
                return;
            }
            const payload = LoggingPayload.fromJSON(portPayload);
            if ("message" in payload.payload) {
                await sendLog(ns, loggingSettings, payload);
            }
            else if ("key" in payload.payload) {
                await sendTrace(ns, loggingSettings, payload);
            }
        }
        await ns.sleep(500);
    }
}

export { loggingServicePath, main };
