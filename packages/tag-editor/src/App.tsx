import * as React from "react";

const Graph = require("react-graph-vis").default;
import { observer } from "mobx-react";
import { getStores } from "./stores";
import { toJS } from "mobx";

const options = {
  layout: {
    hierarchical: false
  },
  edges: {
    color: "#000000"
  }
};

interface AppState {
  counter: number;
  events: any;
}

const App = observer(
  class App extends React.Component<any, AppState> {
    constructor(props: any) {
      super(props);
      this.state = {
        counter: 5,
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
      getStores().graph.fetchState();
    }

    private createNode(x: number, y: number) {
      console.log("lol", x, y);
    }

    private renderGraph() {
      const { events } = this.state;
      const { state } = getStores().graph;
      return state ? (
        <Graph
          graph={state}
          options={options}
          events={events}
          style={{ height: "640px" }}
        />
      ) : null;
    }

    public render() {
      return <div>{this.renderGraph()}</div>;
    }
  }
);

export default App;
