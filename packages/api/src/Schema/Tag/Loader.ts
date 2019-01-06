import DataLoader from "dataloader";
import { firestore as Firestore } from "firebase";
import { either as Either, option as Option } from "fp-ts";
import _ from "lodash/fp";
import Moment from "moment";

import * as Utility from "../../Utility";
import * as Context from "../Context";
import * as Tag from "./index";

interface Data {
  name: string;
  aliases?: string[];
  score?: number;
  lastOccurrence?: Firestore.Timestamp;
  connections?: Firestore.DocumentReference[];
}

export type Loader = ReturnType<typeof loader>;
type Result = Either.Either<Error, Tag.Tag>;

export const loader = (DB: Firestore.Firestore): DataLoader<string, Result> =>
  new DataLoader(async keys => {
    const tags = new Map<string, Result>();

    // Run attempts to get tags in parallel
    await Promise.all(
      keys.map(async key => {
        try {
          /*
            Since Toggl stores tag names, not IDs, we need to search for both
            First, search for the tag assuming `key` is the `name`
          */
          const tagByName = await getByName(DB, key);
          if (tagByName.isRight()) {
            // If we found it, set both the `ID` and `name` keys to the tag
            tags.set(key, tagByName);
            tags.set(tagByName.value.ID, tagByName);
            return;
          }

          // Search for the tag assuming `key` was an `ID`
          const tagByID = await getByID(DB, key);

          // Set the key for `name` if we found the tag
          if (tagByID.isRight()) tags.set(tagByID.value.name, tagByID);

          // Even if we didn't find the tag, save that result
          tags.set(key, tagByID);
        } catch (error) {
          tags.set(key, Either.left(error));
        }
      })
    );

    // We know the `get` will never be undefined
    return keys.map(key => tags.get(key) as Result);
  });

const getByName = async (
  DB: Firestore.Firestore,
  name: string
): Promise<Result> =>
  Option.fromNullable(
    await DB.collection("tags")
      .where("name", "==", name)
      .limit(1)
      .get()
  )
    .chain(({ docs: [document] }) => Option.fromNullable(document))
    .map(fromDocument)
    .getOrElse(
      Either.left(new Error(`There is no tag with the \`name\` "${name}"`))
    );

export const getByID = async (
  DB: Firestore.Firestore,
  ID: string
): Promise<Result> =>
  Option.fromNullable(
    await DB.collection("tags")
      .doc(ID)
      .get()
  )
    .map(fromDocument)
    .getOrElse(
      Either.left(new Error(`There is no tag with the \`ID\` "${ID}"`))
    );

export const getAll = async (
  context: Context.Context
): Promise<Either.Either<Error, Tag.Tag[]>> => {
  try {
    return Either.right(
      Option.fromNullable(await context.DB.collection("tags").get())
        .map(({ docs }) => docs)
        .getOrElse([])
        .map(document => {
          const result = fromDocument(document);
          context.tagLoader.prime(document.id, result);

          if (result.isLeft()) Utility.throwError(result.value);

          // We throw errors before getting here, so it will always be a `Tag`
          const tag = result.value as Tag.Tag;
          context.tagLoader.prime(tag.name, Either.right(tag));

          return tag;
        })
    ) as any;
  } catch (error) {
    return Either.left(error) as any;
  }
};

const fromDocument = (document: Firestore.DocumentSnapshot): Result =>
  Either.fromNullable(new Error(`No data available for tag "${document.id}"`))(
    document.data() as Data | undefined
  ).map(data => ({
    ID: document.id,
    name: data.name,
    aliases: Option.fromNullable(data.aliases).getOrElse([]),
    score: Option.fromNullable(data.score).getOrElse(0),
    lastOccurrence: Option.fromNullable(data.lastOccurrence).map(timestamp =>
      Moment(timestamp.toDate())
    ),

    connections: Option.fromNullable(data.connections)
      .getOrElse([])
      .map(connection => connection.id)
  }));
