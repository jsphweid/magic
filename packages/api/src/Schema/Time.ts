import gql from "graphql-tag";

import { Interval } from "~/time";

import * as Narrative from "./Narrative";
import * as TagOccurrence from "./TagOccurrence";

export const schema = gql`
  type Time implements HasInterval {
    interval: Interval!
    narratives(sort: Sort = DESCENDING): [Narrative!]!
    tags: [TagOccurrence!]!
  }

  enum Sort {
    ASCENDING
    DESCENDING
  }
`;

export interface Source {
  interval: Interval.Interval;
  narratives: Narrative.Source[];
  tags: TagOccurrence.Source[];
}
