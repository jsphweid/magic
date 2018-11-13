import DataLoader from "dataloader";
import Firebase, { firestore as Firestore } from "firebase";
import { either as Either, option as Option } from "fp-ts";
import gql from "graphql-tag";
import _ from "lodash/fp";
import Moment from "moment";

import * as Utility from "../Utility";
import * as Context from "./Context";
import * as Time from "./Time";

export const schema = gql`
  type Tag implements Node {
    ID: ID!
    name: String!
    aliases: [String!]!
    score: Int!
    lastOccurrence: FormattedDate
    connections: [Tag!]!
  }
`;

export interface Tag {
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  lastOccurrence: Option.Option<Time.Date>;
  connections: string[];
}

interface Data {
  name: string;
  aliases?: string[];
  score?: number;
  lastOccurrence?: Firestore.Timestamp;
  connections?: Firestore.DocumentReference[];
}

const db = Firebase.firestore();

const fromDocument = (
  document: Firestore.DocumentSnapshot
): Either.Either<Error, Tag> =>
  Either.fromNullable(new Error(`No data available`))(document.data() as
    | Data
    | undefined).map(data => ({
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

export const loader = (): DataLoader<string, Either.Either<Error, Tag>> =>
  new DataLoader(async keys => {
    const tags = new Map<string, Either.Either<Error, Tag>>();

    // Run attempts to get tags in parallel
    await Promise.all(
      keys.map(async key => {
        try {
          /*
            Since Toggl stores tag names, not IDs, we need to search for both
            First, search for the tag assuming `key` is the `name`
          */
          const tagByName = Option.fromNullable(
            await db
              .collection("tags")
              .where("name", "==", key)
              .limit(1)
              .get()
          )
            .chain(({ docs: [document] }) => Option.fromNullable(document))
            .map(fromDocument)
            .getOrElse(
              Either.left(
                new Error(`There is no tag with the \`name\` "${key}"`)
              )
            );

          // If we found it, set both the `ID` and `name` keys to the tag
          if (tagByName.isRight()) {
            tags.set(key, tagByName);
            tags.set(tagByName.value.ID, tagByName);
            return;
          }

          // Search for the tag assuming `key` was an `ID`
          const tagByID = Option.fromNullable(
            await db
              .collection("tags")
              .doc(key)
              .get()
          )
            .map(document => fromDocument(document))
            .getOrElse(
              Either.left(
                new Error(
                  `There is no tag with the \`name\` or \`ID\` "${key}"`
                )
              )
            );

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
    return keys.map(key => tags.get(key) as Either.Either<Error, Tag>);
  });

export const resolve = {
  connections: async (
    tag: Tag,
    _args: undefined,
    context: Context.Context
  ): Promise<Tag[]> =>
    (await context.tagLoader.loadMany(tag.connections)).map(tag =>
      tag.getOrElseL(Utility.throwError)
    )
};

// export const get = async (ID: string): Promise<Either.Either<Error, Tag>> => {
//   try {
//     // const document = await db
//     //   .collection("tags")
//     //   .doc(ID)
//     //   .get();

//     throw new Error();

//     // const data = Option.fromNullable(document.data()).getOrElseL(() =>
//     //   Utility.throwError(new Error(`No tag exists with the ID "${ID}"`))
//     // ) as Data;

//     // const connections = [];
//     // if (data.connections) {
//     //   for (const reference of data.connections) {
//     //     connections.push(
//     //       (await get(reference.id)).getOrElseL(Utility.throwError)
//     //     );
//     //   }
//     // }

//     // return Either.right(fromDocument(data));
//   } catch (e) {
//     return Either.left(e);
//   }
// };

// // Return the source for occurrences of tag names or aliases
// export const findMatches = async (
//   search: string
// ): Promise<Either.Either<Error, Tag[]>> => {
//   try {
//     const { docs: documents } = await db.collection("tags").get();

//     const tags: Tag[] = [];
//     for (const document of documents) {
//       tags.push((await get(document.id)).getOrElseL(Utility.throwError));
//     }

//     const matches = tags.reduce(
//       (previous, tag) =>
//         isMatch(search, tag)
//           .map(matchingWord =>
//             previous.set(
//               matchingWord,

//               /*
//                 If another tag matched with the same word, prefer the most recently
//                 used tag
//               */
//               Option.fromNullable(previous.get(matchingWord))
//                 .map(previousMatch => mostRecentlyUsed(tag, previousMatch))
//                 .getOrElse(tag)
//             )
//           )
//           .getOrElse(previous),
//       new Map<string, Tag>()
//     );

//     return Either.right(Array.from(matches.values()));
//   } catch (e) {
//     return Either.left(e);
//   }
// };

export const isMatch = (search: string, tag: Tag): Option.Option<string> => {
  const isTagPerson = false;
  // Option.fromNullable(tag.connections)
  //   .getOrElse([])
  //   .filter(connection =>
  //     ["friend", "family", "coworker"].includes(connection.name)
  //   ).length > 0;

  const namesToMatch = [
    tag.name,

    // If the tag is a person, also match by first name
    ...(isTagPerson ? [tag.name.split("-")[0]] : []),

    // Match any aliases
    ...Option.fromNullable(tag.aliases).getOrElse([])
  ];

  return Option.fromNullable(
    /*
      Surround the string with hypens so we can match based on whole words, not
      words within a word
    */
    `-${nameFromString(search)}-`.match(
      new RegExp(`-${namesToMatch.join("-|-")}-`, "g")
    )
  ).map(matches => matches[0].slice(1, -1)); // Remove the hyphens
};

// const mostRecentlyUsed = (a: Tag, b: Tag): Tag =>
//   a.lastOccurrence.getOrElseL(() => Moment(0)).valueOf() >
//   b.lastOccurrence.getOrElseL(() => Moment(0)).valueOf()
//     ? a
//     : b;

// (async () => {
//   // tslint:disable-next-line
//   console.log(await findMatches("Working on magic with Todd"));
// })();

// Converts human names to tag names e.g. "Getting ready" -> "getting-ready"
const nameFromString = (string: string): string =>
  string
    .trim()
    .toLowerCase()
    .replace(/ /g, "-");
