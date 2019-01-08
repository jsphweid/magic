import { action, decorate } from "mobx";

import client from "../graphql/client";

import { getStores } from ".";
import {
  AllTags,
  CreateTag,
  CreateTagVariables,
  DeleteTag,
  DeleteTagVariables
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

  public createTag = async (name: string): Promise<void> => {
    const response = await client.mutate<CreateTag, CreateTagVariables>({
      mutation: CreateTagMutation,
      variables: { name }
    });
    if (response.data.Tag.create) {
      const { graph, visjsInterface } = getStores();
      const { create } = response.data.Tag;
      graph.addLocalTag(create);
      visjsInterface.selectNode(create.ID);
    }
  };

  public deleteTag = async (id: string): Promise<void> => {
    const response = await client.mutate<DeleteTag, DeleteTagVariables>({
      mutation: DeleteTagMutation,
      variables: { id }
    });

    if (response.data.Tag.delete) {
      getStores().graph.deleteLocalTag(id);
    }
  };
}

decorate(ApiInterfaceStore, {
  fetchState: [action],
  createTag: [action]
});
