import gql from "graphql-tag";

export const schema = gql`
  type Time implements HasInterval {
    interval: Interval!
    narratives(sort: Sort = DESCENDING): [Narrative!]
    tagOccurences: [TagOccurence!]
  }

  enum Sort {
    ASCENDING
    DESCENDING
  }
`;
