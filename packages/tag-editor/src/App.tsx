import * as React from "react";

import GraphEditor, { NodeWithConnections } from "react-graph-db-editor";
import "../node_modules/react-graph-db-editor/dist/index.css";

import { AllTags } from "../__GeneratedCode__";
import client from "./graphql/client";
import AllTagsQuery from "./graphql/queries/AllTags";

import * as actionHandlers from "./actionHandlers";

interface AppState {
  initialData: NodeWithConnections[];
}

export default class App extends React.Component<any, AppState> {
  constructor(props: any) {
    super(props);

    this.state = {
      initialData: []
    };
  }

  public componentDidMount() {
    client.query<AllTags>({ query: AllTagsQuery }).then(response =>
      this.setState({
        initialData: response.data.Tag.tags.map(tag => ({
          id: tag.ID,
          label: tag.name,
          aliases: tag.aliases,
          score: tag.score,
          connections: tag.connections.map(c => c.ID)
        }))
      })
    );
  }

  public render() {
    return (
      <div>
        <GraphEditor
          actionHandlers={actionHandlers}
          initialState={this.state.initialData}
        />
      </div>
    );
  }
}
