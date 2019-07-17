import gql from "graphql-tag";

// import * as History from "./History";
import * as Mutation from "./Mutation";
// import * as Narrative from "./Narrative";
import * as Node from "./Node";
import * as Query from "./Query";
import * as Tag from "./Tag";
import * as Time from "./Time";

export * from "./Context";

export const typeDefs = gql`
  ${Node.typeDefs}
  ${Time.typeDefs}
  ${Tag.typeDefs}

  ${Mutation.typeDefs}
  ${Query.typeDefs}
`;

// for typedefs
export const schema = typeDefs;

// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/22789
export const resolvers: any = {
  Query: {
    Tag: () => Tag.resolvers.Tag__Query
    // History: () => History.resolvers.History__Query
    // Narrative: () => Narrative.resolvers.Narrative__Query
  },

  Mutation: {
    Tag: () => Tag.resolvers.Tag__Mutation
    // History: () => History.resolvers.History__Mutation,
    // Narrative: () => Narrative.resolvers.Narrative__Mutation
  },

  ...Node.resolvers,
  ...Time.resolvers,
  ...Tag.resolvers
  // ...History.resolvers
  // ...Narrative.resolvers
};
