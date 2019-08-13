import { FormattedDate, FormattedDuration } from "@grapheng/time";
import gql from "graphql-tag";

import { Resolvers } from "../../GeneratedTypes";

export const typeDefs = gql`
  scalar GraphengMS
  ${FormattedDate.typeDefs}
  ${FormattedDuration.typeDefs}
`;

export const resolvers: Resolvers = {
  FormattedDate: FormattedDate.resolvers,
  FormattedDuration: FormattedDuration.resolvers
};
