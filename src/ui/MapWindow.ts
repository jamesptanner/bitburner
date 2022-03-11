import { NS } from '@ns'
import { createDotGraph } from '/extern/netgraph';

export const MapWindowPath = "/ui/MapWindow.js";
type Transformation = {
    originX:number
    originY:number
    translateX :number
    translateY:number 
    scale:number 
}
type PanAndZoomRender = {
    minScale: number
    maxScale: number
    element: HTMLElement
    scaleSensitivity: number
    transformation: Transformation
}
const renderer = (e: PanAndZoomRender) => {
    const state = e;

    const pan = (state:PanAndZoomRender, originX:number, originY:number) => {
        state.transformation.translateX += originX;
        state.transformation.translateY += originY;
        state.element.style.transform =
            getMatrix(state.transformation.scale, state.transformation.translateX,  state.transformation.translateY);
    };

    const canPan = (state:PanAndZoomRender) => ({
        panBy: (originX:number, originY:number) => pan(state, originX, originY),
        panTo: (originX:number, originY:number, scale:number) => {
            state.transformation.scale = scale;
            pan(state, originX - state.transformation.translateX, originY - state.transformation.translateY );
        },
    });

    const getMatrix = (scale:number, translateX:number, translateY:number ) =>
        `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;

    const canZoom = (state: PanAndZoomRender) => ({
        zoom: (x:number, y:number, deltaScale:number) => {
            const { left, top } = state.element.getBoundingClientRect();
            const { minScale, maxScale, scaleSensitivity } = state;
            const [scale, newScale] = getScale(state.transformation.scale, minScale, maxScale, scaleSensitivity, deltaScale);
            const originX = x - left;
            const originY = y - top;
            const newOriginX = originX / scale;
            const newOriginY = originY / scale;
            const translate = getTranslate(scale, minScale, maxScale);
            const translateX = translate(originX, state.transformation.originX, state.transformation.translateX );
            const translateY = translate(originY, state.transformation.originY, state.transformation.translateY );

            state.element.style.transformOrigin = `${newOriginX}px ${newOriginY}px`;
            state.element.style.transform = getMatrix( newScale, translateX, translateY );
            state.transformation = { originX: newOriginX, originY: newOriginY, translateX, translateY, scale: newScale };
        }
    });

    const getScale = ( scale:number, minScale:number, maxScale:number, scaleSensitivity:number, deltaScale:number ) => {
        let newScale = scale + (deltaScale / (scaleSensitivity / scale));
        newScale = Math.max(minScale, Math.min(newScale, maxScale));
        return [scale, newScale];
    };

    const hasPositionChanged = (pos:number, prevPos:number) => pos !== prevPos;

    const valueInRange = (minScale:number, maxScale:number, scale:number) => scale <= maxScale && scale >= minScale;

    const getTranslate = (minScale:number, maxScale:number, scale:number) => (pos:number, prevPos:number, translate:number ) =>
        valueInRange(minScale, maxScale, scale) && hasPositionChanged(pos, prevPos)
            ? translate + (pos - prevPos * scale) * (1 - 1 / scale)
            : translate;

    return Object.assign({}, canZoom(state), canPan(state));
};



export async function main(ns: NS): Promise<void> {
    const doc: Document = eval('document') //dont want to pay the toll for this one.
    if (!doc.getElementById("networkMap")) {
        const mapWin = doc.createElement('div')
        mapWin.style.width = "34vh"
        mapWin.style.height = "54vh"
        mapWin.style.position = "fixed"
        mapWin.style.transform = "translate(-18px, -18px)"
        mapWin.style.zIndex = "1000"
        mapWin.style.bottom = "0"
        mapWin.style.right = "0"
        mapWin.style.display = "inline-block"
        mapWin.style.background= "white"
        mapWin.style.overflow = "hidden"

        const image: HTMLImageElement = doc.createElement('img')
        image.style.width = "100%"
        image.style.height = "100%"
        image.style.display = "block"
        image.id = "networkMap"
        mapWin.appendChild(image)
        doc.getElementById("root")?.appendChild(mapWin)
        const renderSettings:PanAndZoomRender ={
            minScale:.1,
            maxScale:50,
            element:image,
            scaleSensitivity:50,
            transformation: {
                originX:0,
                originY:0,
                translateX:0,
                translateY:0,
                scale:1
            }
        }
        const instance = renderer(renderSettings);
        mapWin.addEventListener("wheel", (event) => {
            if (!event.ctrlKey) {
                return;
            }
            event.preventDefault();
            instance.zoom(event.pageX,event.pageY,Math.sign(event.deltaY) > 0 ? 1 : -1);
        });
        mapWin.addEventListener("dblclick", () => {
            instance.panTo(0,0,1);
        });
        mapWin.addEventListener("mousemove", (event) => {
            if (!event.shiftKey) {
                return;
            }
            event.preventDefault();
            instance.panBy(event.movementX,event.movementY);
        })
    }
    const image = doc.getElementById('networkMap') as HTMLImageElement
    image.src = `https://quickchart.io/graphviz?graph=${createDotGraph(ns)}`

}