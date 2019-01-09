import { action, decorate, observable } from "mobx";

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
  public isLoading: boolean = false;
  // computed
  // actions

  public fetchState = async (): Promise<void> => {
    const response = await client.query<AllTags>({ query: AllTagsQuery });

    getStores().graph.setRawTagsData(response.data.Tag.tags);
  };

  public createTag = async (name: string): Promise<Tag> => {
    this.isLoading = true;
    return client
      .mutate<CreateTag, CreateTagVariables>({
        mutation: CreateTagMutation,
        variables: { name }
      })
      .then(response => rawTagToTag(response.data.Tag.create))
      .finally(() => (this.isLoading = false));
  };

  public updateTag = async (basicTag: BasicTag): Promise<Tag> => {
    this.isLoading = true;
    return client
      .mutate<UpdateTag, UpdateTagVariables>({
        mutation: UpdateTagMutation,
        variables: { ...basicTag }
      })
      .then(response => rawTagToTag(response.data.Tag.update))
      .finally(() => (this.isLoading = false));
  };

  public deleteTag = async (id: string): Promise<boolean> => {
    this.isLoading = true;
    return client
      .mutate<DeleteTag, DeleteTagVariables>({
        mutation: DeleteTagMutation,
        variables: { id }
      })
      .then(response => response.data.Tag.delete)
      .finally(() => (this.isLoading = false));
  };
}

decorate(ApiInterfaceStore, {
  isLoading: [observable],
  fetchState: [action],
  createTag: [action]
});
