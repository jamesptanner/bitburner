import { NS } from '@ns'
import { createDotGraph } from '/extern/netgraph';

export const MapWindowPath ="/ui/MapWindow.js";

export async function main(ns : NS) : Promise<void> {
    const doc:Document = eval('document') //dont want to pay the toll for this one.
    const mapWin = doc.createElement('div')
    const image = doc.createElement('img')
    image.src = `https://quickchart.io/graphviz?graph=${createDotGraph(ns)}`
    mapWin.appendChild(image)
    doc.getElementById("root").appendChild(mapWin)

}