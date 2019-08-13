import gql from "graphql-tag";

import { Resolvers } from "../../GeneratedTypes";
import * as External from "./External";
import * as Mutation from "./Mutation";
import * as Node from "./Node";
import * as Query from "./Query";
import * as Tag from "./Tag";
import * as Time from "./Time";

export * from "./Context";

export const typeDefs = gql`
  ${External.typeDefs}
  ${Mutation.typeDefs}
  ${Time.typeDefs}
  ${Node.typeDefs}
  ${Query.typeDefs}

  ${Tag.typeDefs}
`;

// ${Tag.typeDefs}

// for graphql code generator
export const schema = typeDefs;

export const resolvers: Resolvers = {
  // Query: {
  // Tag: () => Tag.resolvers.Tag__Query
  // History: () => History.resolvers.History__Query
  // Narrative: () => Narrative.resolvers.Narrative__Query
  // },

  // ...Node.resolvers,
  // ...Time.resolvers,
  ...Mutation.resolvers,
  ...Query.resolvers,
  ...Tag.resolvers,
  ...External.resolvers
  // ...History.resolvers
  // ...Narrative.resolvers
};
