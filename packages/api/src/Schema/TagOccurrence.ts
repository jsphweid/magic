import gql from "graphql-tag";

import * as Time from "~/time";

import * as Tag from "./Tag";

export const schema = gql`
  type TagOccurrence implements Node & HasInterval {
    id: ID!
    interval: Interval!
    tag: Tag!
  }
`;

export interface Source {
  id: string;
  interval: Time.Interval.Interval;
  tag: Tag.Source;
}