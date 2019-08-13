import { FormattedDate, FormattedDuration } from "@grapheng/time";
import gql from "graphql-tag";

export const typeDefs = gql`
  scalar GraphengMS
  ${FormattedDate.typeDefs}
  ${FormattedDuration.typeDefs}
`;
