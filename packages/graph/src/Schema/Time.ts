import gql from "graphql-tag";

export const schema = gql`
  type Time implements HasInterval {
    interval: Interval!
    narratives(sort: Sort = DESCENDING): [Narrative!]
    tagOccurrences: [TagOccurrence!]
  }

  enum Sort {
    ASCENDING
    DESCENDING
  }
`;
