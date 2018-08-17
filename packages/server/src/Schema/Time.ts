import gql from "graphql-tag";

import * as Time from "~/time";

import * as Narrative from "./Narrative";
import * as TagOccurrence from "./TagOccurrence";

export const schema = gql`
  type Time implements HasInterval {
    interval: Interval!
    narratives(sort: Sort = DESCENDING): [Narrative!]!
    tagOccurrences: [TagOccurrence!]!
  }

  enum Sort {
    ASCENDING
    DESCENDING
  }
`;

export interface Source {
  interval: Time.Interval.Interval;
  narratives: Narrative.Source[];
  tagOccurrences: TagOccurrence.Source[];
}
