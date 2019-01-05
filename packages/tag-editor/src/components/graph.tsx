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
  console.log("lol", x, y);
}

const Graph = observer(() => {
  const { state } = getStores().graph;
  if (!state) return null;
  return (
    <GraphVis
      graph={state}
      options={options}
      events={{
        select: (event: any) => {
          const { nodes, edges } = event;
          console.log("Selected nodes:");
          console.log(nodes);
          console.log("Selected edges:");
          console.log(edges);
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
