import gql from "graphql-tag";

import * as Tag from "./Tag";
import * as Time from "./Time";

export const schema = gql`
  type TagOccurrence implements Node & HasTiming {
    ID: ID!
    timing: Timing!
    tag: Tag!
  }
`;

export interface TagOccurrence {
  ID: string;
  timing: Time.Timing;
  tag: Tag.Tag;
}
