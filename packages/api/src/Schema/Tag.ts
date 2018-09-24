import { either as Either, option as Option } from "fp-ts";
import gql from "graphql-tag";
import _ from "lodash";

import * as Utility from "../Utility";

import DATA from "../../.data/tags.json";

export const schema = gql`
  type Tag implements Node {
    ID: ID!
    name: String!
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

export interface Source {
  ID: string;
  name: string;
  score: string;
  connections: string[];
}

interface Result {
  ID: string;
  name: string;
  score: string;
  connections: Result[];
}

export const resolve = (source: Source): Result => ({
  ...source,
  ID: source.name,
  connections: source.connections.map(name =>
    resolve(
      sourceFromName(name).getOrElseL(() =>
        Utility.throwError(new Error(`"${name}" isn't defined in Magic.`))
      )
    )
  )
});

export const sourceFromName = (name: string): Either.Either<Error, Source> => {
  const formattedName = name
    .trim()
    .toLowerCase()
    .replace(/ /g, "-");

  return Either.fromNullable(new Error(`"${name}" isn't defined in Magic.`))(
    DATA.find(({ name }) => name === formattedName)
  ).map(({ score, connections }) => ({
    ID: formattedName,
    name: formattedName,
    score: Option.fromNullable(score).getOrElse("NEUTRAL"),
    connections: Option.fromNullable(connections).getOrElse([])
  }));
};

export const roots = (source: Source): Either.Either<Error, Source[]> => {
  if (source.connections.length === 0) {
    return Either.right([source]);
  }

  const { errors, connections } = source.connections.reduce<{
    errors: Error[];
    connections: Source[];
  }>(
    (previous, tagName) => {
      const { value: source } = sourceFromName(tagName);
      return source instanceof Error
        ? { ...previous, errors: [...previous.errors, source] }
        : { ...previous, connections: [...previous.connections, source] };
    },
    { errors: [], connections: [] }
  );

  return errors.length > 0
    ? Either.left(new Error(errors.map(({ message }) => message).join(" ")))
    : Either.right(connections);
};

const x = roots(sourceFromName("weed").getOrElse(null as any));
console.log(x);
