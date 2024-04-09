import { NS } from "@ns";

export const bootstrapPath = "/bootstrap.js";

export async function main(ns: NS): Promise<void> {
  //get latest release file
  const releaseDir =
    "https://raw.githubusercontent.com/jamesptanner/bitburner/release";
  //get download map file from list
  const mapResponse = await fetch(`${releaseDir}/map.txt`);
  if (!mapResponse.ok) {
    ns.print(
      `failed to download release manifest. Reason: ${mapResponse.statusText}`,
    );
  }
  const map = Object.entries<string>(await mapResponse.json());

  //iterate over rest of files and download to correct locations.
  for (const [url, name] of map) {
    await ns.wget(
      `${releaseDir}/${url}`,
      name.indexOf("/") === -1 ? name : `/${name}`,
    );
  }
  //launch start.js
  ns.spawn("start.js");
}
