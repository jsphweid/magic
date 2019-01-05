import * as React from "react";

import { observer } from "mobx-react";
import Graph from "./components/graph";
import { getStores } from "./stores";

import { toJS } from "mobx";

const App = observer(
  class App extends React.Component<any, any> {
    constructor(props: any) {
      super(props);
    }

    public componentDidMount() {
      getStores().graph.fetchState();
    }

    public render() {
      return (
        <div>
          <Graph />
        </div>
      );
    }
  }
);

export default App;
