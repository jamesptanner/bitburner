class Path {
  /**
   * Total distance from starting node.
   */
  public distance: number;

  public nodeFrom: Node;

  public constructor(distance: number, nodeFrom: Node) {
      this.distance = distance;
      this.nodeFrom = nodeFrom;
  }
}

class Node {
  /**
   * Arcs starting from this node
   */
  public arcs: Arc[] = [];

  public visited: boolean = false;

  public bestPath: Path;

  /**
   * Object that represent this node in your business logic.
   * In example: "A", new Point(x, y), new Square(4, 2), ...
   */
  public payload: any;

  public constructor(payload: any = null) {
      this.payload = payload;
  }

  public getArcTo(node: Node): Arc | undefined {
      for (let i = 0; i < this.arcs.length; i++) {
          if (this.arcs[i].nodeTo === node) {
              return this.arcs[i];
          }
      }

      return;
  }
}

class Arc {
  public nodeTo: Node;

  public weight: number;

  public constructor(nodeTo: Node, weight: number = 1) {
      this.nodeTo = nodeTo;
      this.weight = weight;
  }
}

class Graph {

  public nodes: Node[] = [];

  public addNode(node: Node): Graph {
      if (!Object.values(this.nodes).includes(node)) {
          this.nodes.push(node);
      }

      return this;
  }

  public removeNode(node: Node): Graph {
      const index = this.nodes.indexOf(node);

      if (-1 === index) {
          return this;
      }

      this.nodes.splice(index, 1);

      return this;
  }

  public addOrientedArc(nodeFrom: Node, nodeTo: Node, weight: number = 1): Graph {
      this
          .addNode(nodeFrom)
          .addNode(nodeTo)
      ;

      nodeFrom.arcs.push(new Arc(nodeTo, weight));

      return this;
  }

  public removeOrientedArc(nodeFrom: Node, nodeTo: Node): Graph {
      const arc = nodeFrom.getArcTo(nodeTo);

      if (arc) {
          nodeFrom.arcs.splice(nodeFrom.arcs.indexOf(arc), 1);
      }

      return this;
  }

  public addArc(node0: Node, node1: Node, weight: number = 1): Graph {
      this
          .addOrientedArc(node0, node1, weight)
          .addOrientedArc(node1, node0, weight)
      ;

      return this;
  }

  public removeArc(node0: Node, node1: Node): Graph {
      this
          .removeOrientedArc(node0, node1)
          .removeOrientedArc(node1, node0)
      ;

      return this;
  }

  public findNodeByPayload(payload: any): Node {
      return this.nodes
          .find(node => node.payload === payload)
      ;
  }

  public clone(): Graph {
      const graphClone = new Graph();
      const nodeClones: Map<Node, Node> = new Map();

      this.nodes.forEach(nodeSource => {
          const nodeClone = new Node(nodeSource.payload);
          nodeClones.set(nodeSource, nodeClone);
          graphClone.addNode(nodeClone);
      });

      this.nodes.forEach(nodeSource => {
          nodeSource.arcs.forEach(arcSource => {
              graphClone.addOrientedArc(
                  nodeClones.get(nodeSource),
                  nodeClones.get(arcSource.nodeTo),
                  arcSource.weight,
              );
          });
      });

      return graphClone;
  }
}


class Dijkstra {
  public graph: Graph;

  public nodeStart: Node;

  public constructor(graph: Graph, nodeStart: Node) {
      this.graph = graph;
      this.nodeStart = nodeStart;
  }

  public init(): void {
      this.graph.nodes.forEach(node => {
          node.visited = false;
          node.bestPath = null;
      });
  }

  public calculate(): void {
      this.init();

      this.nodeStart.bestPath = new Path(0, null);

      let currentNode = this.nodeStart;

      while (currentNode) {
          currentNode.arcs.forEach(arc => {
              const path = new Path(currentNode.bestPath.distance + arc.weight, currentNode);

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
              })
          ;
      }
  }

  /**
   * Once calculated has been called,
   * returns best path to a node,
   * or null if no path to go here.
   */
  public getPathTo(nodeTo: Node): Node[]|null {
      const path: Node[] = [];

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



export { Arc, Dijkstra, Graph, Node, }