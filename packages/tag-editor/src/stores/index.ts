import { observable } from "mobx";
import GraphStore from "./graph";
import NetworkStore from "./network";

let stores = initialize();

function initialize() {
  const graph = new GraphStore();
  const network = new NetworkStore();

  return observable({
    graph,
    network
  });
}

export function getStores(): StoresType {
  return stores;
}

export function reinitializeStores(): StoresType {
  stores = initialize();
  return stores;
}

export const initializeReturnType = returnType(initialize);
export type StoresType = typeof initializeReturnType;

function returnType<T>(fn: () => T) {
  if (typeof fn === "string") {
    (fn as any)();
  }
  return {} as T;
}
