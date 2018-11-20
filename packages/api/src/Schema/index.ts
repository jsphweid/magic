import gql from "graphql-tag";

import * as History from "./History";
import * as Mutation from "./Mutation";
import * as Narrative from "./Narrative";
import * as Node from "./Node";
import * as Query from "./Query";
import * as Tag from "./Tag";
import * as Time from "./Time";

export * from "./Context";

export const source = gql`
  ${Query.schema}
  ${Mutation.schema}
  ${Node.schema}
  ${Time.schema}
  ${Tag.schema}
  ${History.schema}
  ${Narrative.schema}
`;

// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/22789
export const resolvers: any = {
  Query: Query.resolve,
  Mutation: Mutation.resolve,
  ...Node.resolvers,
  ...Time.resolvers,
  ...Tag.resolvers
};
