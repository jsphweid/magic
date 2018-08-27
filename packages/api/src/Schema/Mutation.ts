import gql from "graphql-tag";

import * as Time from "~/time";

export const schema = gql`
  type Mutation {
    setTime(start: Date, stop: Date, narrative: String, tags: [String!]): Time!

    setNarrative(start: Date, stop: Date, text: String): Time!

    addTags(start: Date, stop: Date, tags: [String!]): Time!
    removeTags(start: Date, stop: Date, tags: [String!]): Time!
  }
`;

export const resolvers = {
  setTime: (
    _source: never,
    args: {
      narrative: string | null;
      tags: string[] | null;
    }
  ) => ({
    narratives: [{ description: args.narrative }],
    tagOccurences: Time.Tag.fromNames(args.tags || []).map(tag => ({ tag }))
  })
};
