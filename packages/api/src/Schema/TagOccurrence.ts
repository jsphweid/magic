import gql from "graphql-tag";

import * as Tag from "./Tag";
import * as Time from "./Time";

export const schema = gql`
  type TagOccurrence implements Node & HasInterval {
    ID: ID!
    interval: Interval!
    tag: Tag!
  }
`;

export interface TagOccurence {
  ID: string;
  interval: Time.Interval;
  tag: Tag.Tag;
}
