import { observable } from "mobx";
import GraphStore from "./graph";

let stores = initialize();

function initialize() {
  const graph = new GraphStore();

  return observable({
    graph
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
