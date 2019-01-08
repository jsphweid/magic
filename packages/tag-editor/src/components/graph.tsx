import * as React from "react";

import { observer } from "mobx-react";
import { getStores } from "../stores";
const GraphVis = require("react-graph-vis").default;

const options = {
  layout: {
    hierarchical: false
  },
  edges: {
    color: "#000000"
  }
};

function createNodeHandler(x: number, y: number) {
  getStores().graph.addNode({ label: "temp", x, y });
}

const Graph: React.SFC = observer(() => {
  const { graph, visjsInterface } = getStores();
  if (!graph.graphState) return null;
  return (
    <GraphVis
      graph={graph.graphState}
      options={options}
      events={{
        select: (event: any) => {
          const { nodes } = event;
          if (nodes.length) {
            visjsInterface.selectNode(nodes[0]);
          }
        },
        doubleClick: (event: any) => {
          const {
            pointer: { canvas }
          } = event;
          createNodeHandler(canvas.x, canvas.y);
        }
      }}
      style={{ height: "640px" }}
      getNetwork={(network: any) => visjsInterface.init(network)}
    />
  );
});

export default Graph;
