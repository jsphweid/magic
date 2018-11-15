import Firebase, { firestore as Firestore } from "firebase";
import * as Tag from "./Tag";

export interface Context {
  DB: Firestore.Firestore;
  tagLoader: Tag.Loader;
}

export const context = (): Context => {
  const DB = Firebase.firestore();
  const tagLoader = Tag.loader(DB);
  return { DB, tagLoader };
};
