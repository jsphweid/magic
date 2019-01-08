import { action, computed, decorate, observable } from "mobx";
import { Graph } from "../types";

import { getStores } from ".";
import { Tag } from "../../__generatedTypes__";
import { NodeInput } from "../types/graph";
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

  public setRawTagsData = (rawTagsData: Tag[]): void => {
    this._rawTagsData = rawTagsData;
  };

  public setActiveNode = (id: string): void => {
    this._activeNodeId = id;
  };

  public clearActiveNode = (): void => {
    this._activeNodeId = null;
    getStores().visjsInterface.deselectAll();
  };

  // consider just getting raw tags data again upon every action...
  public deleteNode = async (id: string): Promise<void> => {
    if (!this._rawTagsData) return;
    const wasSuccessful = await getStores().apiInterface.deleteTag(id);
    if (wasSuccessful) {
      this._rawTagsData = this._rawTagsData.filter(tag => tag.ID !== id);
    }
  };
  public addNode = async (node: NodeInput): Promise<void> => {
    if (!this._rawTagsData) return;
    const tag = await getStores().apiInterface.createTag(node.label);
    this._rawTagsData.push(tag);
    getStores().visjsInterface.selectNode(tag.ID);
  };
}

decorate(GraphStore, {
  _rawTagsData: [observable],
  _activeNodeId: [observable],
  memoizedTagMap: [computed],
  activeTag: [computed],
  graphState: [computed],
  setActiveNode: [action],
  clearActiveNode: [action]
});
