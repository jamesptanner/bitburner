import { NS } from '@ns'
import { createDotGraph } from '/extern/netgraph';

export const MapWindowPath ="/ui/MapWindow.js";

export async function main(ns : NS) : Promise<void> {
    const doc:Document = eval('document') //dont want to pay the toll for this one.
    if(!doc.getElementById("networkMap")){
        const mapWin = doc.createElement('div')
        mapWin.style.width = "34vh"
        mapWin.style.height ="54vh"
        mapWin.style.position ="fixed"
        mapWin.style.transform ="translate(-18px, 436px)"
        mapWin.style.zIndex =1000
        mapWin.style.top =0
        mapWin.style.right =0
        mapWin.style.display ="inline-block"

        const image:HTMLImageElement = doc.createElement('img')
        image.style.width = "100%"
        image.style.height ="100%"
        image.style.display ="block"
        image.id = "networkMap"
        mapWin.appendChild(image)
        doc.getElementById("root").appendChild(mapWin)
    }
    const image = doc.getElementById('networkMap')
    image.src = `https://quickchart.io/graphviz?graph=${createDotGraph(ns)}`

}