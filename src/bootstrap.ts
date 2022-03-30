import { NS } from '@ns'

export const bootstrapPath ="/bootstrap.js";

export async function main(ns : NS) : Promise<void> {
   //get latest release file
   ns.killall()
   const response = await fetch("https://api.github.com/repos/jamesptanner/bitburner/releases/latest")
   if(!response.ok){
      ns.print(`failed to download release manifest. Reason: ${response.statusText}`)   
   }
   const releaseInfo = await response.json()
   //extract list of files and treat the map as special.

   const files = new Map<string,string>()
   let mapURL = ""
   for(const file of releaseInfo['assets']){
      if(file.name !== "map.txt"){
         files.set(file.name,file.browser_download_url)
      }
      else{
         mapURL = file.browser_download_url
      }
   }

   //get download map file from list
   const mapResponse = await fetch(mapURL)
   if(!mapResponse.ok){
      ns.print(`failed to download release manifest. Reason: ${mapResponse.statusText}`)   
   }
   const map = await mapResponse.json()

   //iterate over rest of files and download to correct locations.
   files.forEach(async (url,name)=>{
      await ns.wget(url,name)
   })
   //launch start.js
   ns.spawn("start.js")
}