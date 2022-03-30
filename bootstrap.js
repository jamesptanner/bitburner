const bootstrapPath = "/bootstrap.js";
async function main(ns) {
    //get latest release file
    const releaseDir = "https://raw.githubusercontent.com/jamesptanner/bitburner/release/package";
    //get download map file from list
    const mapResponse = await fetch(`${releaseDir}/map.txt`);
    if (!mapResponse.ok) {
        ns.print(`failed to download release manifest. Reason: ${mapResponse.statusText}`);
    }
    const map = Object.entries(await mapResponse.json());
    //iterate over rest of files and download to correct locations.
    for (const [url, name] of map) {
        await ns.wget(`${releaseDir}/${url}`, name);
    }
    //launch start.js
    ns.spawn("start.js");
}

export { bootstrapPath, main };
