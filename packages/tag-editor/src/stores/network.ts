import { action, decorate, observable } from "mobx";

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
}

decorate(NetworkStore, {
  _network: [observable],
  init: [action],
  deselectAll: [action]
});
