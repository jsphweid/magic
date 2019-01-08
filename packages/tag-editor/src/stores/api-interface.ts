import { action, decorate } from "mobx";

import client from "../graphql/client";

import { getStores } from ".";
import {
  AllTags,
  CreateTag,
  CreateTagVariables
} from "../../__generatedTypes__";
import AllTagsQuery from "../graphql/queries/AllTags";
import CreateTagMutation from "../graphql/queries/CreateTag";

export default class ApiInterfaceStore {
  // observables
  // computed
  // actions

  public fetchState = async (): Promise<void> => {
    const response = await client.query<AllTags>({ query: AllTagsQuery });
    getStores().graph.setRawTagsData(response.data.Tag.tags);
  };

  public createTag = async (name: string): Promise<void> => {
    try {
      const response = await client.mutate<CreateTag, CreateTagVariables>({
        mutation: CreateTagMutation,
        variables: { name }
      });
      console.log("create tag response", response);
    } catch (e) {
      console.log("Could not create tag:", e);
    }
  };
}

decorate(ApiInterfaceStore, {
  fetchState: [action],
  createTag: [action]
});
