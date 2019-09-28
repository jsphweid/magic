import gql from "graphql-tag";

import { Resolvers } from "../../GeneratedTypes";
import * as External from "./External";
import * as History from "./History";
import * as Mutation from "./Mutation";
import * as Narrative from "./Narrative";
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
  ${Narrative.typeDefs}
  ${History.typeDefs}
  ${Tag.typeDefs}
`;

// for graphql code generator
export const schema = typeDefs;

export const resolvers: Resolvers = {
  ...Time.resolvers,
  ...Mutation.resolvers,
  ...Query.resolvers,
  ...Tag.resolvers,
  ...External.resolvers,
  ...Narrative.resolvers,
  ...History.resolvers
};
