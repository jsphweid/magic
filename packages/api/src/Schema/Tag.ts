// import DataLoader from "dataloader";
import * as Firebase from "firebase";
import { either as Either, option as Option } from "fp-ts";
import gql from "graphql-tag";
import _ from "lodash/fp";
import Moment from "moment";

import * as Utility from "../Utility";
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
  connections: Tag[];
}

interface Data {
  ID: string;
  name: string;
  aliases?: string[];
  score?: number;
  connections?: Firebase.firestore.DocumentReference[];
  lastOccurrence?: Firebase.firestore.Timestamp;
}

const db = Firebase.firestore();
// const loader = new DataLoader(keys => {

// })

export const get = async (ID: string): Promise<Either.Either<Error, Tag>> => {
  try {
    const document = await db
      .collection("tags")
      .doc(ID)
      .get();

    const data = Option.fromNullable(document.data()).getOrElseL(() =>
      Utility.throwError(new Error(`No tag exists with the ID "${ID}"`))
    ) as Data;

    const connections = [];
    if (data.connections) {
      for (const reference of data.connections) {
        connections.push(
          (await get(reference.id)).getOrElseL(Utility.throwError)
        );
      }
    }

    return Either.right(fromData(connections, data));
  } catch (e) {
    return Either.left(e);
  }
};

// Return the source for occurrences of tag names or aliases
export const findMatches = async (
  search: string
): Promise<Either.Either<Error, Tag[]>> => {
  try {
    const { docs: documents } = await db.collection("tags").get();
    const tags = documents.map(document => document.data() as Tag);

    const matches = new Map<string, Tag>();
    for (const tag of tags) {
      isMatch(search, tag).map(matchingWord =>
        matches.set(
          matchingWord,
          Option.fromNullable(matches.get(matchingWord)).fold(
            tag,
            previousMatch => mostRecent(tag, previousMatch)
          )
        )
      );
    }

    return Either.right(Array.from(matches.values()));
  } catch (e) {
    return Either.left(e);
  }
};

const isMatch = (_search: string, tag: Tag): Option.Option<string> => {
  return Option.some(tag.name);
};

const mostRecent = (a: Tag, b: Tag): Tag =>
  a.lastOccurrence.getOrElseL(() => Moment(0)).valueOf() >
  b.lastOccurrence.getOrElseL(() => Moment(0)).valueOf()
    ? a
    : b;

// (async () => {
//   // tslint:disable-next-line
//   console.log(await findMatches("Outside browsing with Ellie"));
// })();

//   const names = `-${nameFromString(string)}-`;

//   return Data.filter(source => {
//     const isSourcePerson =
//       Option.fromNullable(source.connections)
//         .getOrElse([])
//         .filter(connectionName =>
//           ["friend", "family", "coworker"].includes(connectionName)
//         ).length > 0;

//     const namesToMatch = [
//       source.name,
//       ...(isSourcePerson ? [source.name.split("-")[0]] : []), // First name
//       ...Option.fromNullable(source.aliases).getOrElse([])
//     ];

//     const matches = names.match(
//       new RegExp(`-${namesToMatch.join("-|-")}-`, "g")
//     );

//     return Option.fromNullable(matches).isSome();
//   }).map(fromJson);
// };

/*
  Given a tag name, which tags is it connected to that are most general?
  e.g. The roots for "browsing" are ["recreation"]
*/
// export const roots = (tag: Tag): Tag[] => {
//   if (tag.connections.length === 0) return [tag];

//   // Recursively expand child connections
//   return tag.connections.reduce<Tag[]>(
//     (previous, connection) =>
//       Option.fromNullable(Data.find(({ name }) => name === connection.name))
//         .map(json => _.uniqBy("ID", [...previous, ...roots(fromJson(json))]))
//         .getOrElse(previous),
//     []
//   );
// };

/*
  Convert data from Firestore into a `Tag`. Connections must be provided
  otherwise the `connections` field would be document references.
*/
const fromData = (connections: Tag[], data: Data): Tag => ({
  ID: data.ID,
  name: data.name,
  aliases: Option.fromNullable(data.aliases).getOrElse([]),
  score: Option.fromNullable(data.score).getOrElse(0),
  lastOccurrence: Option.none,
  connections
});

// Converts human names to tag names e.g. "Getting ready" -> "getting-ready"
// const nameFromString = (string: string): string =>
//   string
//     .trim()
//     .toLowerCase()
//     .replace(/ /g, "-");
