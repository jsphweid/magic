import { Date, Duration, Rounding } from "@grapheng/units";
import gql from "graphql-tag";

import { Resolvers } from "../../GeneratedCode";

export const typeDefs = gql`
  ${Rounding.typeDefs}
  ${Date.GraphQL.inputType.typeDefs}
  ${Date.GraphQL.outputType.typeDefs}
  ${Duration.GraphQL.inputType.typeDefs}
  ${Duration.GraphQL.outputType.typeDefs}
`;

export const resolvers: Resolvers = {
  DateOutput: Date.GraphQL.outputType.resolvers,
  DurationOutput: Duration.GraphQL.outputType.resolvers
};
