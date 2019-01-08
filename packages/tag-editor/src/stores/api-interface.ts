import { action, decorate } from "mobx";

import client from "../graphql/client";

import { getStores } from ".";
import {
  AllTags,
  CreateTag,
  CreateTagVariables,
  DeleteTag,
  DeleteTagVariables,
  Tag
} from "../../__generatedTypes__";
import AllTagsQuery from "../graphql/queries/AllTags";
import CreateTagMutation from "../graphql/queries/CreateTag";
import DeleteTagMutation from "../graphql/queries/DeleteTag";

export default class ApiInterfaceStore {
  // observables
  // computed
  // actions

  public fetchState = async (): Promise<void> => {
    const response = await client.query<AllTags>({ query: AllTagsQuery });

    getStores().graph.setRawTagsData(response.data.Tag.tags);
  };

  public createTag = async (name: string): Promise<Tag> => {
    return client
      .mutate<CreateTag, CreateTagVariables>({
        mutation: CreateTagMutation,
        variables: { name }
      })
      .then(response => {
        console.log("response", response);
        return response.data.Tag.create;
      });
  };

  public deleteTag = async (id: string): Promise<boolean> => {
    return client
      .mutate<DeleteTag, DeleteTagVariables>({
        mutation: DeleteTagMutation,
        variables: { id }
      })
      .then(response => response.data.Tag.delete);
  };
}

decorate(ApiInterfaceStore, {
  fetchState: [action],
  createTag: [action]
});
