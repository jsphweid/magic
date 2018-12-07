import Firebase, { firestore as Firestore } from "firebase";
import Moment from "moment";
import * as Tag from "./Tag";

export interface Context {
  now: Moment.Moment;
  DB: Firestore.Firestore;
  tagLoader: Tag.Loader;
}

export const context = (): Context => {
  const DB = Firebase.firestore();
  return { now: Moment(), DB, tagLoader: Tag.loader(DB) };
};
