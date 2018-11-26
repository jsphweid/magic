import gql from "graphql-tag";

import * as History from "./History";
import * as Narrative from "./Narrative";
import * as Node from "./Node";
import * as Tag from "./Tag";
import * as Time from "./Time";

export * from "./Context";

export const source = gql`
  type Query {
    Tag: Tag__Query!
    History: History__Query!
    Narrative: Narrative__Query!
  }

  type Mutation {
    Tag: Tag__Mutation!
    Narrative: Narrative__Mutation!
  }

  ${Node.schema}
  ${Time.schema}
  ${Tag.schema}
  ${History.schema}
  ${Narrative.schema}
`;

// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/22789
export const resolvers: any = {
  Query: {
    Tag: () => Tag.resolvers.Tag__Query,
    History: () => History.resolvers.History__Query,
    Narrative: () => Narrative.resolvers.Narrative__Query
  },

  Mutation: {
    // Tag: () => Tag.resolvers.Tag__Mutation,
    // History: () => History.resolvers.History__Mutation,
    Narrative: () => Narrative.resolvers.Narrative__Mutation
  },

  ...Node.resolvers,
  ...Time.resolvers,
  ...Tag.resolvers,
  ...History.resolvers,
  ...Narrative.resolvers
};
