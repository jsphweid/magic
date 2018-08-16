import gql from "graphql-tag";

import * as Time from "~/time";

export const schema = gql`
  type Narrative implements Node & HasInterval {
    id: ID!
    interval: Interval!
    description: String!
  }
`;

export interface Source {
  id: string;
  interval: Time.Interval.Interval;
  description: string;
}
