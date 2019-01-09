import { action, computed, decorate, observable } from "mobx";
import { Graph, Tag } from "../types";

import { getStores } from ".";
import { RawTag } from "../../__generatedTypes__";
import { BasicTag } from "../components/tag-editor";
import { NodeInput } from "../types/graph";
import { deriveEdgesFromTags, rawTagToTag } from "../utils";

/*
 * Unfortunately, it seems that without using '@' decorators (I gave up trying to
 * get that to work for now), I don't think it is possible to decorate private
 * methods as the decorator method outside the class. So I reverted to _varName.
 */
export default class GraphStore {
  // observables
  public _allTags: Tag[] | null = null;
  public _activeNodeId: string | null = null;

  // computed
  public get activeTag(): Tag | null {
    return this._activeNodeId && this.memoizedTagMap
      ? this.memoizedTagMap[this._activeNodeId]
      : null;
  }

  public get memoizedTagMap(): { [key: string]: Tag } | null {
    if (!this._allTags) return null;

    const obj: { [key: string]: Tag } = {};

    this._allTags.forEach(tag => {
      obj[tag.ID] = tag;
    });

    return obj;
  }

  public get graphState(): Graph | null {
    if (!this._allTags) return null;
    const nodes = this._allTags.map(({ ID, name }) => ({
      id: ID,
      label: name
    }));
    return { nodes, edges: deriveEdgesFromTags(this._allTags) };
  }

  // actions

  public setRawTagsData = (rawTagsData: RawTag[]): void => {
    this._allTags = rawTagsData.map(rawTagToTag);
  };

  public setActiveNode = (id: string | null): void => {
    this._activeNodeId = id;
  };

  public clearActiveNode = (): void => {
    this._activeNodeId = null;
    getStores().visjsInterface.deselectAll();
  };

  // consider just getting raw tags data again upon every action...
  public deleteNode = async (id: string): Promise<void> => {
    if (!this._allTags) return;
    const wasSuccessful = await getStores().apiInterface.deleteTag(id);
    if (wasSuccessful) {
      this._allTags = this._allTags.filter(tag => tag.ID !== id);
    }
  };
  public addNode = async (node: NodeInput): Promise<void> => {
    if (!this._allTags) return;
    const tag = await getStores().apiInterface.createTag(node.label);
    this._allTags.push(tag);
    getStores().visjsInterface.selectNode(tag.ID);
  };
  public updateNode = async (basicTag: BasicTag): Promise<void> => {
    if (!this._allTags) return;
    console.log("updateNode");
    const updatedTag = await getStores().apiInterface.updateTag(basicTag);
    console.log("searching");
    // this._rawTagsData.forEach(tag => {
    //   if (tag.ID === updatedTag.ID) {
    //     console.log("updating");
    //     tag = updatedTag;
    //   }
    // });
    const i = this._allTags.findIndex(tag => tag.ID === basicTag.ID);
    this._allTags[i] = updatedTag;
  };
}

decorate(GraphStore, {
  _allTags: [observable],
  _activeNodeId: [observable],
  memoizedTagMap: [computed],
  activeTag: [computed],
  graphState: [computed],
  setActiveNode: [action],
  clearActiveNode: [action]
});
