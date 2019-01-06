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

function createNode(x: number, y: number) {
  getStores().graph.createTag("temp");
}

const Graph: React.SFC = observer(() => {
  const { graphState, setActiveNode } = getStores().graph;
  if (!graphState) return null;
  return (
    <GraphVis
      graph={graphState}
      options={options}
      events={{
        select: (event: any) => {
          const { nodes } = event;
          if (nodes.length) {
            setActiveNode(nodes[0]);
          }
        },
        doubleClick: (event: any) => {
          const {
            pointer: { canvas }
          } = event;
          createNode(canvas.x, canvas.y);
        }
      }}
      style={{ height: "640px" }}
    />
  );
});

export default Graph;
