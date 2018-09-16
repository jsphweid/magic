import gql from "graphql-tag";

import * as Interval from "./Interval";
import * as Tag from "./Tag";

export const schema = gql`
  type TagOccurrence implements Node & HasInterval {
    ID: ID!
    interval: Interval!
    tag: Tag!
  }
`;

export interface Source {
  ID: string;
  interval: Interval.Source;
  tag: Tag.Source;
}
