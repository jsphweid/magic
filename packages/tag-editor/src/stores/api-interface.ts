import { action, decorate } from "mobx";

import client from "../graphql/client";

import { getStores } from ".";
import {
  AllTags,
  CreateTag,
  CreateTagVariables,
  DeleteTag,
  DeleteTagVariables,
  UpdateTag,
  UpdateTagVariables
} from "../../__generatedTypes__";

import { BasicTag } from "../components/tag-editor";
import AllTagsQuery from "../graphql/queries/AllTags";
import CreateTagMutation from "../graphql/queries/CreateTag";
import DeleteTagMutation from "../graphql/queries/DeleteTag";
import UpdateTagMutation from "../graphql/queries/UpdateTag";
import { Tag } from "../types";
import { rawTagToTag } from "../utils";

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
      .then(response => rawTagToTag(response.data.Tag.create));
  };

  public updateTag = async (basicTag: BasicTag): Promise<Tag> => {
    return client
      .mutate<UpdateTag, UpdateTagVariables>({
        mutation: UpdateTagMutation,
        variables: { ...basicTag }
      })
      .then(response => rawTagToTag(response.data.Tag.update));
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
