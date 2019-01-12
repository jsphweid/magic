import * as React from "react";

import { observer } from "mobx-react";
import Graph from "./components/graph";
import { getStores } from "./stores";

import Sidebar from "./components/sidebar";
import { initKeyListeners } from "./keys";

const App = observer(
  class App extends React.Component<any, any> {
    constructor(props: any) {
      super(props);
    }

    public componentDidMount() {
      const { apiInterface, visjsInterface, graph } = getStores();

      apiInterface.fetchState();

      initKeyListeners({
        e: () => visjsInterface.toggleEditConnection(),
        c: () => visjsInterface.toggleCreateConnection(),
        Escape: () => {
          visjsInterface.selectNode();
          visjsInterface.disableEditMode();
        },
        Delete: () => graph.deleteActiveElement(),
        Backspace: () => graph.deleteActiveElement()
      });
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
