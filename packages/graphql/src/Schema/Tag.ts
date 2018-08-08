import gql from "graphql-tag";

import * as Toggl from "~/toggl";
import * as Tags from "~/symbols";

export const schema = gql`
  type Tag implements Node {
    id: ID!
    name: String!
    score: Score!
    connections: [Tag!]
  }

  enum Score {
    POSITIVE_HIGH
    POSITIVE_MEDIUM
    POSITIVE_LOW
    NEUTRAL
    NEGATIVE_LOW
    NEGATIVE_MEDIUM
    NEGATIVE_HIGH
  }
`;

export const resolvers = {
  score: (source: Toggl.Tag) => {
    const tag = Tags.all.find(({ name }) => name === source.name);
    switch ((tag && tag.score) || 0) {
      case 3:
        return "POSITIVE_HIGH";
      case 2:
        return "POSITIVE_MEDIUM";
      case 1:
        return "POSITIVE_LOW";
      case 0:
        return "NEUTRAL";
      case -1:
        return "NEGATIVE_LOW";
      case -2:
        return "NEGATIVE_MEDIUM";
      case -3:
        return "NEGATIVE_HIGH";
    }
  }
};
