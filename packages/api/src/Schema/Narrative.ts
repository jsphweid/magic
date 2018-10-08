import gql from "graphql-tag";

import * as Interval from "./Interval";

export const schema = gql`
  type Narrative implements Node & HasInterval {
    ID: ID!
    interval: Interval!
    description: String!
  }
`;

export interface Narrative {
  ID: string;
  interval: Interval.Interval;
  description: string;
}
