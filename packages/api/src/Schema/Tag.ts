import { option as Option } from "fp-ts";

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
  connections: Option.fromNullable(source.connections)
    .map(connections => connections.map(name => resolve(sourceFromName(name))))
    .getOrElse([])
});

/*
  If trying to source a tag which isn't defined in the data, throw the error to
  GraphQL
*/
export const sourceFromName = (name: string): Source => {
  const formattedName = name
    .trim()
    .toLowerCase()
    .replace(/ /g, "-");

  const { score, connections } = Option.fromNullable(
    DATA.find(({ name }) => name === formattedName)
  ).getOrElseL(() =>
    Utility.throwError(new Error(`"${formattedName}" isn't defined in Magic.`))
  );

  return {
    ID: formattedName,
    name: formattedName,
    score: Option.fromNullable(score).getOrElse("NEUTRAL"),
    connections: Option.fromNullable(connections).getOrElse([])
  };
};
