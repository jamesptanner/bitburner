import { NS } from '@ns'

export const bootstrapPath ="/bootstrap.js";

export async function main(ns : NS) : Promise<void> {
   //get latest release file
   ns.killall()
   const releaseDir = "https://raw.githubusercontent.com/jamesptanner/bitburner/release/package"
   //get download map file from list
   const mapResponse = await fetch(`${releaseDir}/map.txt`)
   if(!mapResponse.ok){
      ns.print(`failed to download release manifest. Reason: ${mapResponse.statusText}`)   
   }
   const map = await mapResponse.json()

   //iterate over rest of files and download to correct locations.
   map.forEach(async (url,name)=>{
      await ns.wget(`${releaseDir}/${url}`,name)
   })
   //launch start.js
   ns.spawn("start.js")
}