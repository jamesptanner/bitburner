function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}

function createDotGraph(ns) {
    let dotText = "digraph Hosts {";
    const servers = getAllServers(ns);
    servers.push("home");
    const serverMap = new Map();
    servers.forEach(host => {
        const serverInfo = ns.getServer(host);
        dotText = dotText + `nd_${servers.indexOf(host)} [label = "${host}\\n${serverInfo.requiredHackingSkill}" color=${serverInfo.backdoorInstalled || serverInfo.purchasedByPlayer ? "green" : (serverInfo.openPortCount >= serverInfo.numOpenPortsRequired && serverInfo.requiredHackingSkill <= ns.getPlayer().hacking ? "yellow" : "red")}]`;
        serverMap.set(host, `nd_${servers.indexOf(host)}`);
    });
    servers.forEach(host => {
        const hosts = ns.scan(host);
        if (hosts.length != 0) {
            dotText = dotText + `${serverMap.get(host)} -> {${hosts.map(host => serverMap.get(host)).join()}}`;
        }
    });
    dotText = dotText + "}";
    return dotText;
}

const MapWindowPath = "/ui/MapWindow.js";
const renderer = (e) => {
    const state = e;
    const pan = (state, originX, originY) => {
        state.transformation.translateX += originX;
        state.transformation.translateY += originY;
        state.element.style.transform =
            getMatrix(state.transformation.scale, state.transformation.translateX, state.transformation.translateY);
    };
    const canPan = (state) => ({
        panBy: (originX, originY) => pan(state, originX, originY),
        panTo: (originX, originY, scale) => {
            state.transformation.scale = scale;
            pan(state, originX - state.transformation.translateX, originY - state.transformation.translateY);
        },
    });
    const getMatrix = (scale, translateX, translateY) => `matrix(${scale}, 0, 0, ${scale}, ${translateX}, ${translateY})`;
    const canZoom = (state) => ({
        zoom: (x, y, deltaScale) => {
            const { left, top } = state.element.getBoundingClientRect();
            const { minScale, maxScale, scaleSensitivity } = state;
            const [scale, newScale] = getScale(state.transformation.scale, minScale, maxScale, scaleSensitivity, deltaScale);
            const originX = x - left;
            const originY = y - top;
            const newOriginX = originX / scale;
            const newOriginY = originY / scale;
            const translate = getTranslate(scale, minScale, maxScale);
            const translateX = translate(originX, state.transformation.originX, state.transformation.translateX);
            const translateY = translate(originY, state.transformation.originY, state.transformation.translateY);
            state.element.style.transformOrigin = `${newOriginX}px ${newOriginY}px`;
            state.element.style.transform = getMatrix(newScale, translateX, translateY);
            state.transformation = { originX: newOriginX, originY: newOriginY, translateX, translateY, scale: newScale };
        }
    });
    const getScale = (scale, minScale, maxScale, scaleSensitivity, deltaScale) => {
        let newScale = scale + (deltaScale / (scaleSensitivity / scale));
        newScale = Math.max(minScale, Math.min(newScale, maxScale));
        return [scale, newScale];
    };
    const hasPositionChanged = (pos, prevPos) => pos !== prevPos;
    const valueInRange = (minScale, maxScale, scale) => scale <= maxScale && scale >= minScale;
    const getTranslate = (minScale, maxScale, scale) => (pos, prevPos, translate) => valueInRange(minScale, maxScale, scale) && hasPositionChanged(pos, prevPos)
        ? translate + (pos - prevPos * scale) * (1 - 1 / scale)
        : translate;
    return Object.assign({}, canZoom(state), canPan(state));
};
async function main(ns) {
    const eval2 = eval;
    const doc = eval2('document'); //dont want to pay the toll for this one.
    if (!doc.getElementById("networkMap")) {
        const mapWin = doc.createElement('div');
        mapWin.id = "mapWindow";
        mapWin.style.width = "34vh";
        mapWin.style.height = "fit-content";
        mapWin.style.position = "fixed";
        mapWin.style.transform = "translate(-18px, -18px)";
        mapWin.style.zIndex = "1000";
        mapWin.style.bottom = "0";
        mapWin.style.right = "0";
        mapWin.style.display = "inline-block";
        mapWin.style.background = "white";
        mapWin.style.overflow = "hidden";
        const image = doc.createElement('img');
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.display = "block";
        image.id = "networkMap";
        mapWin.appendChild(image);
        doc.getElementById("root")?.appendChild(mapWin);
    }
    const mapWin = doc.getElementById('mapWindow');
    const image = doc.getElementById('networkMap');
    image.src = `https://quickchart.io/graphviz?graph=${createDotGraph(ns)}`;
    const renderSettings = {
        minScale: .1,
        maxScale: 50,
        element: image,
        scaleSensitivity: 100,
        transformation: {
            originX: 0,
            originY: 0,
            translateX: 0,
            translateY: 0,
            scale: 1
        }
    };
    const instance = renderer(renderSettings);
    const wheelEvent = (event) => {
        if (!event.ctrlKey) {
            return;
        }
        event.preventDefault();
        instance.zoom(event.pageX, event.pageY, Math.sign(event.deltaY) > 0 ? 1 : -1);
    };
    mapWin.removeEventListener("wheel", wheelEvent);
    mapWin.addEventListener("wheel", wheelEvent);
    const dblclickEvent = () => {
        instance.panTo(0, 0, 1);
    };
    mapWin.removeEventListener("dblclick", dblclickEvent);
    mapWin.addEventListener("dblclick", dblclickEvent);
    const mouseMoveEvent = (event) => {
        if (!event.shiftKey) {
            return;
        }
        event.preventDefault();
        instance.panBy(event.movementX, event.movementY);
    };
    mapWin.removeEventListener("mousemove", mouseMoveEvent);
    mapWin.addEventListener("mousemove", mouseMoveEvent);
}

export { MapWindowPath, main };
