const infiltratePath = "/hosts/infiltrate.js";

var build = {};

var Arc$1 = {};

Object.defineProperty(Arc$1, "__esModule", { value: true });
class Arc {
    constructor(nodeTo, weight = 1) {
        this.nodeTo = nodeTo;
        this.weight = weight;
    }
}
Arc$1.default = Arc;

var Dijkstra$2 = {};

var Path$1 = {};

Object.defineProperty(Path$1, "__esModule", { value: true });
class Path {
    constructor(distance, nodeFrom) {
        this.distance = distance;
        this.nodeFrom = nodeFrom;
    }
}
Path$1.default = Path;

Object.defineProperty(Dijkstra$2, "__esModule", { value: true });
const Path_1 = Path$1;
class Dijkstra$1 {
    constructor(graph, nodeStart) {
        this.graph = graph;
        this.nodeStart = nodeStart;
    }
    init() {
        this.graph.nodes.forEach(node => {
            node.visited = false;
            node.bestPath = null;
        });
    }
    calculate() {
        this.init();
        this.nodeStart.bestPath = new Path_1.default(0, null);
        let currentNode = this.nodeStart;
        while (currentNode) {
            currentNode.arcs.forEach(arc => {
                const path = new Path_1.default(currentNode.bestPath.distance + arc.weight, currentNode);
                if (!arc.nodeTo.bestPath || path.distance < arc.nodeTo.bestPath.distance) {
                    arc.nodeTo.bestPath = path;
                }
            });
            currentNode.visited = true;
            currentNode = null;
            this.graph.nodes
                .filter(node => !node.visited && node.bestPath)
                .forEach(node => {
                if (null === currentNode || node.bestPath.distance < currentNode.bestPath.distance) {
                    currentNode = node;
                }
            });
        }
    }
    /**
     * Once calculated has been called,
     * returns best path to a node,
     * or null if no path to go here.
     */
    getPathTo(nodeTo) {
        const path = [];
        if (!nodeTo.bestPath) {
            return null;
        }
        let node = nodeTo;
        while (node) {
            path.unshift(node);
            node = node.bestPath.nodeFrom;
        }
        return path;
    }
}
Dijkstra$2.default = Dijkstra$1;

var Graph$2 = {};

var Node$2 = {};

Object.defineProperty(Node$2, "__esModule", { value: true });
class Node$1 {
    constructor(payload = null) {
        /**
         * Arcs starting from this node
         */
        this.arcs = [];
        this.visited = false;
        this.payload = payload;
    }
    getArcTo(node) {
        for (let i = 0; i < this.arcs.length; i++) {
            if (this.arcs[i].nodeTo === node) {
                return this.arcs[i];
            }
        }
        return null;
    }
}
Node$2.default = Node$1;

Object.defineProperty(Graph$2, "__esModule", { value: true });
const Node_1$1 = Node$2;
const Arc_1$1 = Arc$1;
class Graph$1 {
    constructor() {
        this.nodes = [];
    }
    addNode(node) {
        if (!Object.values(this.nodes).includes(node)) {
            this.nodes.push(node);
        }
        return this;
    }
    removeNode(node) {
        const index = this.nodes.indexOf(node);
        if (-1 === index) {
            return this;
        }
        this.nodes.splice(index, 1);
        return this;
    }
    addOrientedArc(nodeFrom, nodeTo, weight = 1) {
        this
            .addNode(nodeFrom)
            .addNode(nodeTo);
        nodeFrom.arcs.push(new Arc_1$1.default(nodeTo, weight));
        return this;
    }
    removeOrientedArc(nodeFrom, nodeTo) {
        const arc = nodeFrom.getArcTo(nodeTo);
        if (arc) {
            nodeFrom.arcs.splice(nodeFrom.arcs.indexOf(arc), 1);
        }
        return this;
    }
    addArc(node0, node1, weight = 1) {
        this
            .addOrientedArc(node0, node1, weight)
            .addOrientedArc(node1, node0, weight);
        return this;
    }
    removeArc(node0, node1) {
        this
            .removeOrientedArc(node0, node1)
            .removeOrientedArc(node1, node0);
        return this;
    }
    findNodeByPayload(payload) {
        return this.nodes
            .find(node => node.payload === payload);
    }
    clone() {
        const graphClone = new Graph$1();
        const nodeClones = new Map();
        this.nodes.forEach(nodeSource => {
            const nodeClone = new Node_1$1.default(nodeSource.payload);
            nodeClones.set(nodeSource, nodeClone);
            graphClone.addNode(nodeClone);
        });
        this.nodes.forEach(nodeSource => {
            nodeSource.arcs.forEach(arcSource => {
                graphClone.addOrientedArc(nodeClones.get(nodeSource), nodeClones.get(arcSource.nodeTo), arcSource.weight);
            });
        });
        return graphClone;
    }
}
Graph$2.default = Graph$1;

Object.defineProperty(build, "__esModule", { value: true });
const Arc_1 = Arc$1;
build.Arc = Arc_1.default;
const Dijkstra_1 = Dijkstra$2;
var Dijkstra = build.Dijkstra = Dijkstra_1.default;
const Graph_1 = Graph$2;
var Graph = build.Graph = Graph_1.default;
const Node_1 = Node$2;
var Node = build.Node = Node_1.default;

function getAllServers(ns) {
    return JSON.parse(ns.read("hosts.txt"));
}
const routeToHost = function (ns, start, end) {
    const graph = new Graph();
    const servers = getAllServers(ns);
    servers.push("home");
    servers.forEach(server => {
        if (!graph.findNodeByPayload(server)) {
            graph.addNode(new Node(server));
        }
        const neighbours = ns.scan(server);
        neighbours.forEach(neighbour => {
            if (!graph.findNodeByPayload(neighbour)) {
                graph.addNode(new Node(neighbour));
            }
            graph.addArc(graph.findNodeByPayload(server), graph.findNodeByPayload(neighbour));
        });
    });
    const startNode = graph.findNodeByPayload(start);
    const endNode = graph.findNodeByPayload(end);
    if (startNode && endNode) {
        const dijkstra = new Dijkstra(graph, startNode);
        dijkstra.calculate();
        const path = dijkstra.getPathTo(endNode);
        if (path) {
            return path.map(node => node.payload) || [];
        }
    }
    return [];
};

async function main(ns) {
    const toBackdoor = [];
    const toInfiltrate = [];
    const servers = getAllServers(ns);
    const ignoreHosts = JSON.parse(ns.read("ignoreHosts.txt") || "[]");
    for (const server of servers.filter(x => ignoreHosts.indexOf(x) == -1)) {
        const serverInfo = ns.getServer(server);
        if (!serverInfo.backdoorInstalled && !serverInfo.purchasedByPlayer) {
            if (!serverInfo.hasAdminRights) {
                const targetHackLevel = ns.getServerRequiredHackingLevel(server);
                if (targetHackLevel <= ns.getHackingLevel()) {
                    ns.tprintf(`INFO 💣 ${server}`);
                    if (!serverInfo.purchasedByPlayer) {
                        if (ns.exec(infiltratePath, "home", 1, server) === 0) {
                            if (toInfiltrate.length == 0)
                                ns.tprintf(`WARN: not enough memory to auto infiltrate. Waiting till end.`);
                            toInfiltrate.push(server);
                        }
                    }
                }
            }
            else if (serverInfo.requiredHackingSkill <= ns.getPlayer().hacking) {
                ns.tprintf(`WARN 💻 Backdoor ${server}`);
                ns.tprintf(`INFO nav via ${routeToHost(ns, 'home', server)}`);
                toBackdoor.push(server);
            }
        }
    }
    await ns.write("toBackdoor.txt", JSON.stringify(toBackdoor), "w");
    if (toInfiltrate.length > 0) {
        await ns.write("toInfiltrate.txt", JSON.stringify(toInfiltrate), "w");
        ns.spawn(infiltratePath, 1);
    }
}

export { main };
