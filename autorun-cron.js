const triggerJobPath = "/cron/triggerJob.js";

const cronPath = "/autorun/cron.js";
const jobs = [
    {
        script: "/net/walker.js",
        args: [],
        interval: 1000 * 60,
        disable: false
    },
    {
        script: "contracts/findContracts.js",
        args: [],
        interval: 1000 * 60,
        disable: false
    },
    {
        script: "cron/createScripts.js",
        args: [],
        interval: 10 * 1000 * 60,
        disable: false
    },
    {
        script: "cron/buyScripts.js",
        args: [],
        interval: 10 * 1000 * 60,
        disable: false
    },
    {
        script: "cron/updateBestHost.js",
        args: [],
        interval: 5 * 60 * 1000,
        disable: false
    },
    {
        script: "cron/processBackdoors.js",
        args: [],
        interval: 5 * 60 * 1000,
        disable: false
    },
    {
        script: "cron/checkForUpdate.js",
        args: [],
        interval: 60 * 60 * 1000,
        disable: false
    },
];
async function main(ns) {
    ns.ps().filter(proc => { return proc.filename.indexOf(triggerJobPath) != -1; }).forEach(proc => ns.kill(proc.pid));
    jobs.filter(job => { return !job.disable; }).forEach(job => {
        ns.run(triggerJobPath, 1, job.interval, job.script, ...job.args);
    });
}

export { cronPath, main };
