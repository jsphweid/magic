import gql from "graphql-tag";

import * as Interval from "./Interval";

export const schema = gql`
  type Narrative implements Node & HasInterval {
    ID: ID!
    interval: Interval!
    description: String!
  }
`;

export interface Source {
  ID: string;
  interval: Interval.Source;
  description: string;
}
