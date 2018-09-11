import gql from "graphql-tag";

import { Interval } from "~/time";

export const schema = gql`
  type Narrative implements Node & HasInterval {
    id: ID!
    interval: Interval!
    description: String!
  }
`;

export interface Source {
  id: string;
  interval: Interval.Interval;
  description: string;
}
