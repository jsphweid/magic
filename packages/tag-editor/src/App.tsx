import * as React from "react";

const Graph = require("react-graph-vis").default;

const options = {
  layout: {
    hierarchical: false
  },
  edges: {
    color: "#000000"
  }
};

function randomColor() {
  const red = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");
  const green = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");
  const blue = Math.floor(Math.random() * 256)
    .toString(16)
    .padStart(2, "0");
  return `#${red}${green}${blue}`;
}

interface Node {
  id: number;
  label: string;
  color: string;
  x?: number;
  y?: number;
}

interface Edge {
  from: number;
  to: number;
}

interface AppState {
  counter: number;
  graph: {
    nodes: Node[];
    edges: Edge[];
  };
  events: any;
}

export default class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props);
    this.state = {
      counter: 5,
      graph: {
        nodes: [
          { id: 1, label: "Node 1", color: "#e04141" },
          { id: 2, label: "Node 2", color: "#e09c41" },
          { id: 3, label: "Node 3", color: "#e0df41" },
          { id: 4, label: "Node 4", color: "#7be041" },
          { id: 5, label: "Node 5", color: "#41e0c9" }
        ],
        edges: [
          { from: 1, to: 2 },
          { from: 1, to: 3 },
          { from: 2, to: 4 },
          { from: 2, to: 5 }
        ]
      },
      events: {
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
          this.createNode(canvas.x, canvas.y);
        }
      }
    };
  }

  public componentDidMount() {
    this.setState({ counter: 5 });
  }

  private createNode(x: number, y: number) {
    const color = randomColor();
    const {
      graph: { nodes, edges },
      counter
    } = this.state;

    const id = counter + 1;

    this.setState({
      graph: {
        nodes: [...nodes, { id, label: `Node ${id}`, color, x, y }],
        edges: [...edges]
      },
      counter: id
    });
  }

  public render() {
    const { graph, events } = this.state;
    return (
      <div>
        <h1>React graph vis</h1>
        <p>
          <a href="https://github.com/crubier/react-graph-vis">Github</a> -{" "}
          <a href="https://www.npmjs.com/package/react-graph-vis">NPM</a>
        </p>
        <p>
          <a href="https://github.com/crubier/react-graph-vis/tree/master/example">
            Source of this page
          </a>
        </p>
        <p>
          A React component to display beautiful network graphs using vis.js
        </p>
        <p>
          Make sure to visit <a href="http://visjs.org">visjs.org</a> for more
          info.
        </p>
        <p>This package allows to render network graphs using vis.js.</p>
        <p>
          Rendered graphs are scrollable, zoomable, retina ready, dynamic, and
          switch layout on double click.
        </p>
        <Graph
          graph={graph}
          options={options}
          events={events}
          style={{ height: "640px" }}
        />
      </div>
    );
  }
}
