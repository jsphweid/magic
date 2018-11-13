import gql from "graphql-tag";

import * as Time from "./Time";

export const schema = gql`
  type Narrative implements Node & HasInterval {
    ID: ID!
    interval: Interval!
    description: String!
  }
`;

export interface Narrative {
  ID: string;
  interval: Time.Interval;
  description: string;
}
