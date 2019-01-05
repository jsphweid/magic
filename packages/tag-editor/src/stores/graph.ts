import { action, computed, decorate, observable, toJS } from "mobx";
import { Graph, Tag } from "../types";

import client from "../graphql/client";

import { AllTags } from "../../__generatedTypes__";
import AllTagsQuery from "../graphql/queries/AllTags";
import { deriveEdgesFromTags } from "../utils";

export default class GraphStore {
  public rawTagsData: Tag[] | undefined;

  public get state(): Graph | undefined {
    if (!this.rawTagsData) return undefined;
    const nodes = this.rawTagsData.map(({ ID, name }) => ({
      id: ID,
      label: name
    }));

    return { nodes, edges: deriveEdgesFromTags(this.rawTagsData) };
  }

  public async fetchState(): Promise<void> {
    console.log(client);
    const response = await client.query<AllTags>({ query: AllTagsQuery });
    this.rawTagsData = response.data.Tag.tags;
    console.log("---", JSON.stringify(toJS(this.rawTagsData)));
  }
}

decorate(GraphStore, {
  rawTagsData: [observable],
  state: [computed],
  fetchState: [action]
});
