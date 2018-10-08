import { either as Either, option as Option } from "fp-ts";
import gql from "graphql-tag";
import _ from "lodash/fp";

import Data from "../../.data/tags.json";
import * as Utility from "../Utility";

export const schema = gql`
  type Tag implements Node {
    ID: ID!
    name: String!
    aliases: [String!]!
    score: Score!
    connections: [Tag!]!
  }

  enum Score {
    POSITIVE_HIGH
    POSITIVE_MEDIUM
    POSITIVE_LOW
    NEUTRAL
    NEGATIVE_LOW
    NEGATIVE_MEDIUM
    NEGATIVE_HIGH
  }
`;

interface Json {
  name: string;
  aliases?: string[];
  score?: string;
  connections?: string[];
}

export interface Tag {
  ID: string;
  name: string;
  aliases: string[];
  score: string;
  connections: Tag[];
}

/*
  If we have a name, does it exist withing the defined set of tags? If so,
  convert it into a `Source`
*/
export const fromName = (name: string): Either.Either<Error, Tag> => {
  const formattedName = nameFromString(name);

  return Either.fromNullable(
    new Error(`"${formattedName}" isn't defined in Magic.`)
  )(Data.find(({ name }) => name === formattedName)).map(fromJson);
};

// Return the source for occurrences of tag names or aliases
export const fromString = (string: string): Tag[] => {
  const names = `-${nameFromString(string)}-`;

  return Data.filter(source => {
    const isSourcePerson =
      Option.fromNullable(source.connections)
        .getOrElse([])
        .filter(connectionName =>
          ["friend", "family", "coworker"].includes(connectionName)
        ).length > 0;

    const namesToMatch = [
      source.name,
      ...(isSourcePerson ? [source.name.split("-")[0]] : []), // First name
      ...Option.fromNullable(source.aliases).getOrElse([])
    ];

    const matches = names.match(
      new RegExp(`-${namesToMatch.join("-|-")}-`, "g")
    );

    return Option.fromNullable(matches).isSome();
  }).map(fromJson);
};

/*
  Given a tag name, which tags is it connected to that are most general?
  e.g. The roots for "browsing" are ["recreation"]
*/
export const roots = (tag: Tag): Tag[] => {
  if (tag.connections.length === 0) return [tag];

  // Recursively expand child connections
  return tag.connections.reduce<Tag[]>(
    (previous, connection) =>
      Option.fromNullable(Data.find(({ name }) => name === connection.name))
        .map(json => _.uniqBy("ID", [...previous, ...roots(fromJson(json))]))
        .getOrElse(previous),
    []
  );
};

// Build a source from the data format in `../../.data/tags.json`
const fromJson = (json: Json): Tag => ({
  ID: json.name,
  name: json.name,
  aliases: Option.fromNullable(json.aliases).getOrElse([]),
  score: Option.fromNullable(json.score).getOrElse("NEUTRAL"),
  connections: Option.fromNullable(json.connections).getOrElse([])
});

// Converts human names to tag names e.g. "Getting ready" -> "getting-ready"
const nameFromString = (string: string): string =>
  string
    .trim()
    .toLowerCase()
    .replace(/ /g, "-");
