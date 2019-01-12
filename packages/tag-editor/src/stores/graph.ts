import { action, computed, decorate, observable, toJS } from "mobx";
import { Graph, Tag } from "../types";

import { getStores } from ".";
import { RawTag } from "../../__generatedTypes__";
import { NodeInput } from "../types/graph";
import { convertRawTagToTag, deriveEdgesFromTags, parseEdgeId } from "../utils";

/*
 * Unfortunately, it seems that without using '@' decorators (I gave up trying to
 * get that to work for now), I don't think it is possible to decorate private
 * methods as the decorator method outside the class. So I reverted to _varName.
 */
export default class GraphStore {
  // observables
  public _activeNodeId: string | null = null;
  public _activeEdgeId: string | null = null;
  public tagMap: { [key: string]: Tag } = {};

  // computed
  public get activeTag(): Tag | null {
    return this._activeNodeId ? this.tagMap[this._activeNodeId] : null;
  }

  public get graphState(): Graph | null {
    const tagsAsArray = Object.values(this.tagMap);
    const nodes = tagsAsArray.map(({ ID, name }) => ({
      id: ID,
      label: name
    }));
    return { nodes, edges: deriveEdgesFromTags(tagsAsArray) };
  }

  // actions

  public initData = (rawTagsData: RawTag[]): void => {
    const tagMap: { [key: string]: Tag } = {};

    rawTagsData.map(convertRawTagToTag).forEach(tag => {
      tagMap[tag.ID] = tag;
    });

    this.tagMap = tagMap;
  };

  public setActiveNode = (id: string | null): void => {
    this._activeNodeId = id;
  };

  public setActiveEdge = (id: string | null): void => {
    this._activeEdgeId = id;
  };

  public deleteActiveElement = async (): Promise<void> => {
    if (this._activeNodeId) {
      // handle this some day
    } else if (this._activeEdgeId) {
      const { fromId, toId } = parseEdgeId(this._activeEdgeId);
      const relevantTag = this.tagMap[fromId];
      const newConnections = relevantTag.immediateConnections.filter(
        c => c.toId !== toId
      );
      this.setActiveEdge(null);
      this.tagMap[fromId] = {
        ...relevantTag,
        immediateConnections: relevantTag.immediateConnections.map(c =>
          c.toId === toId ? { toId: c.toId, isLoading: true } : c
        )
      };
      await this.updateNode({
        ...relevantTag,
        immediateConnections: newConnections
      });
    }
  };

  public addConnection = async (from: string, to: string): Promise<void> => {
    // callback({ from, to, id, dashes: true });

    const relevantTag = this.tagMap[from];
    if (relevantTag.immediateConnections.map(c => c.toId).includes(to)) return;

    // add temp connection
    // const i = this._allTags.findIndex(t => t.ID === from);
    this.tagMap[from] = {
      ...relevantTag,
      immediateConnections: [
        ...relevantTag.immediateConnections,
        { toId: to, isLoading: true }
      ]
    };

    console.log("---", toJS(this.tagMap[from]));

    const updatedTag = await getStores().apiInterface.updateTag({
      ...relevantTag,
      immediateConnections: [
        ...relevantTag.immediateConnections,
        { toId: to, isLoading: false }
      ]
    });
    this.tagMap[from] = updatedTag;
  };

  public clearActiveNode = (): void => {
    this._activeNodeId = null;
    getStores().visjsInterface.deselectAll();
  };

  // consider just getting raw tags data again upon every action...
  public deleteNode = async (id: string): Promise<void> => {
    const wasSuccessful = await getStores().apiInterface.deleteTag(id);
    if (wasSuccessful) {
      delete this.tagMap[id];
    }
  };
  public addNode = async (node: NodeInput): Promise<void> => {
    // push temp?
    const tag = await getStores().apiInterface.createTag(node.label);
    this.tagMap[tag.ID] = tag;
    getStores().visjsInterface.selectNode(tag.ID);
  };
  public updateNode = async (tag: Tag): Promise<void> => {
    const updatedTag = await getStores().apiInterface.updateTag(tag);
    this.tagMap[tag.ID] = updatedTag;
  };
}

// do this in a singular transaction? (combine graph and api-interface)
// i dont like how multiple updates can be called from anywhere

decorate(GraphStore, {
  _activeNodeId: [observable],
  _activeEdgeId: [observable],
  tagMap: [observable],
  addConnection: [action],
  deleteActiveElement: [action],
  activeTag: [computed],
  graphState: [computed],
  setActiveNode: [action],
  clearActiveNode: [action]
});
