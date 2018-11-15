import gql from "graphql-tag";

import * as History from "./History";
import * as Mutation from "./Mutation";
import * as Narrative from "./Narrative";
import * as Query from "./Query";
import * as Tag from "./Tag";
import * as TagOccurrence from "./TagOccurrence";
import * as Time from "./Time";

export * from "./Context";

export const source = gql`
  ${Query.schema}
  ${Mutation.schema}

  interface HasInterval {
    interval: Interval!
  }

  interface Node {
    ID: ID!
  }

  ${History.schema}
  ${Narrative.schema}
  ${Tag.schema}
  ${TagOccurrence.schema}

  ${Time.schema}
`;

// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/22789
export const resolvers: any = {
  Query: Query.resolve,
  Mutation: Mutation.resolve,

  ...Time.resolvers,

  Tag: Tag.resolve,

  Node: { __resolveType: () => "Node" },
  HasInterval: { __resolveType: () => "HasInterval" }
};
