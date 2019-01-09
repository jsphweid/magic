import { action, decorate, observable } from "mobx";
import { getStores } from ".";

export default class NetworkStore {
  // observables
  public _network: any | null = null;

  // computed

  // actions
  public init = (network: any): void => {
    this._network = network;
  };

  public deselectAll = (): void => {
    this._network.selectNodes([]);
    this._network.selectEdges([]);
  };

  public selectNode = (id?: string): void => {
    if (id) {
      this._network.selectNodes([id]);
      getStores().graph.setActiveNode(id);
    } else {
      getStores().graph.setActiveNode(null);
    }
  };
}

decorate(NetworkStore, {
  _network: [observable],
  init: [action],
  deselectAll: [action]
});
