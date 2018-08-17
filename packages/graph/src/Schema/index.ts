import gql from "graphql-tag";
import * as GraphQL from "graphql";

import * as Query from "./Query";
import * as Mutation from "./Mutation";
import * as Interval from "./Interval";
import * as Duration from "./Duration";
import * as Time from "./Time";
import * as Narrative from "./Narrative";
import * as Tag from "./Tag";
import * as TagOccurrence from "./TagOccurrence";

export const source = gql`
  ${GraphQL.print(Query.schema)}
  ${GraphQL.print(Mutation.schema)}

  interface HasInterval {
    interval: Interval!
  }

  ${GraphQL.print(Interval.schema)}
  ${GraphQL.print(Duration.schema)}

  ${GraphQL.print(Time.schema)}

  interface Node {
    id: ID!
  }

  ${GraphQL.print(Narrative.schema)}

  ${GraphQL.print(Tag.schema)}
  ${GraphQL.print(TagOccurrence.schema)}

  scalar Date
`;

export const resolvers = {
  Query: Query.resolvers,
  Mutation: Mutation.resolvers,
  Interval: Interval.resolvers,
  Duration: Duration.resolvers,

  Node: { __resolveType: () => "Node" },
  HasInterval: { __resolveType: () => "HasInterval" }
};

// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/22789
export const schema: any = {
  typeDefs: GraphQL.print(source),
  resolvers
};
