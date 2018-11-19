import gql from "graphql-tag";

import * as Time from "./Time";

export const schema = gql`
  type Narrative implements Node & HasTiming {
    ID: ID!
    timing: Timing!
    description: String!
  }
`;

export interface Narrative {
  ID: string;
  timing: Time.Timing;
  description: string;
}
