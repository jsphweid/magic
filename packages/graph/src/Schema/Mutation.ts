import gql from "graphql-tag";

import * as Time from "~/time";

export const schema = gql`
  type Mutation {
    setTime(narrative: String, tags: [String!]): Time!

    setNarrative(text: String): Time!
    addTags(tags: [String!]): Time!
    removeTags(tags: [String!]): Time!
  }
`;

export const resolvers = {
  setTime: (
    _source: never,
    args: { narrative: string | null; tags: string[] | null }
  ) => ({
    narratives: [{ description: args.narrative }],
    tagOccurences:
      args.tags && args.tags.length !== 0
        ? Time.Tag.fromNames(args.tags).map(tag => ({ tag }))
        : null
  })
};
