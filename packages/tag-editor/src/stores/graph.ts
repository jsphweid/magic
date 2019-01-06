import { action, computed, decorate, observable } from "mobx";
import { Graph } from "../types";

import client from "../graphql/client";

import {
  AllTags,
  Tag,
  CreateTag,
  CreateTagVariables
} from "../../__generatedTypes__";
import AllTagsQuery from "../graphql/queries/AllTags";
import CreateTagMutation from "../graphql/queries/CreateTag";
import { deriveEdgesFromTags } from "../utils";

/*
 * Unfortunately, it seems that without using '@' decorators (I gave up trying to
 * get that to work for now), I don't think it is possible to decorate private
 * methods as the decorator method outside the class. So I reverted to _varName.
 */
export default class GraphStore {
  // observables

  public _rawTagsData: Tag[] | null = null;

  public _activeNodeId: string | null = null;

  // computed

  public get activeTag(): Tag | null {
    return this._activeNodeId && this.memoizedTagMap
      ? this.memoizedTagMap[this._activeNodeId]
      : null;
  }

  public get memoizedTagMap(): { [key: string]: Tag } | null {
    if (!this._rawTagsData) return null;

    const obj: { [key: string]: Tag } = {};

    this._rawTagsData.forEach(tag => {
      obj[tag.ID] = tag;
    });

    return obj;
  }

  public get graphState(): Graph | null {
    if (!this._rawTagsData) return null;
    const nodes = this._rawTagsData.map(({ ID, name }) => ({
      id: ID,
      label: name
    }));

    return { nodes, edges: deriveEdgesFromTags(this._rawTagsData) };
  }

  // actions

  public fetchState = async (): Promise<void> => {
    const response = await client.query<AllTags>({ query: AllTagsQuery });
    this._rawTagsData = response.data.Tag.tags;
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

  public setActiveNode = (id: string): void => {
    this._activeNodeId = id;
  };
}

decorate(GraphStore, {
  _rawTagsData: [observable],
  _activeNodeId: [observable],
  memoizedTagMap: [computed],
  activeTag: [computed],
  graphState: [computed],
  fetchState: [action],
  setActiveNode: [action],
  createTag: [action]
});
