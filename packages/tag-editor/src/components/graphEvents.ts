import { getStores } from "../stores";
import { makeEdgeId } from "../utils";

const { graph, visjsInterface } = getStores();

export const manipulationEvents = {
  addEdge: (data: any, callback: any) => {
    const { from, to } = data;
    if (from === to) {
      return; // ignore self-referential edges
    } else {
      const id = makeEdgeId(from, to);
      graph.addConnection(from, to);
    }
  }
};

export const userEvents = {
  selectNode: (event: any) => {
    const { nodes } = event;
    if (nodes.length) {
      visjsInterface.selectNode(nodes[0]);
    }
  },
  selectEdge: (event: any) => {
    const { edges } = event;
    if (edges.length) {
      visjsInterface.selectEdge(edges[0]);
    }
  },
  deselectEdge: () => visjsInterface.selectEdge(),
  deselectNode: () => visjsInterface.selectNode(),
  doubleClick: (event: any) => {
    const {
      pointer: { canvas }
    } = event;
    graph.addNode({ label: "temp", x: canvas.x, y: canvas.y });
  }
};
