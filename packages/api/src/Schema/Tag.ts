import { either as Either, option as Option } from "fp-ts";
import gql from "graphql-tag";
import _ from "lodash/fp";

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
    resolve(sourceFromName(name).getOrElseL(Utility.throwError))
  )
});

/*
  If we have a name, does it exist withing the defined set of tags? If so,
  convert it into a `Source`
*/
export const sourceFromName = (name: string): Either.Either<Error, Source> => {
  const formattedName = nameFromString(name);
  return Either.fromNullable(
    new Error(`"${formattedName}" isn't defined in Magic.`)
  )(DATA.find(({ name }) => name === formattedName)).map(
    ({ score, connections }) => ({
      ID: formattedName,
      name: formattedName,
      score: Option.fromNullable(score).getOrElse("NEUTRAL"),
      connections: Option.fromNullable(connections).getOrElse([])
    })
  );
};

const sourcesFromString = (string: string): Source[] => {
  const names = nameFromString(string);
  return DATA.filter(source => names.includes(source.name)).map(source => ({
    ID: source.name,
    name: source.name,
    score: Option.fromNullable(source.score).getOrElse("NEUTRAL"),
    connections: Option.fromNullable(source.connections).getOrElse([])
  }));
};

const nameFromString = (string: string): string =>
  string
    .trim()
    .toLowerCase()
    .replace(/ /g, "-");

console.log(sourcesFromString("Lunch with John and Brian"));

/*
  Given a tag name, which tags is it connected to which are most general?
  e.g. The roots for "browsing" are ["recreation"]
*/
export const roots = (name: string): Either.Either<Error, Source[]> => {
  const { value: source } = sourceFromName(name);
  if (source instanceof Error) {
    return Either.left(source);
  }

  if (source.connections.length === 0) {
    return Either.right([source]);
  }

  /*
    For all of the connections, try recursively expanding child connections
    and keep track of any errors we receive
  */
  const { errors, connections } = source.connections
    .map(name => roots(name))
    .reduce<{
      errors: Error[];
      connections: Source[];
    }>(
      (previous, { value: connections }) =>
        connections instanceof Error
          ? { ...previous, errors: [...previous.errors, connections] }
          : {
              ...previous,
              connections: [...previous.connections, ...connections]
            },
      { errors: [], connections: [] }
    );

  return errors.length > 0
    ? Either.left(new Error(errors.map(({ message }) => message).join(" ")))
    : Either.right(_.uniqBy("ID", connections));
};
