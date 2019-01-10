import * as React from "react";

import { observer } from "mobx-react";
import Graph from "./components/graph";
import { getStores } from "./stores";

import Sidebar from "./components/sidebar";

const App = observer(
  class App extends React.Component<any, any> {
    constructor(props: any) {
      super(props);
    }

    public componentDidMount() {
      getStores().apiInterface.fetchState();
    }

    public render() {
      return (
        <div>
          <Sidebar />
          <Graph />
        </div>
      );
    }
  }
);

export default App;
