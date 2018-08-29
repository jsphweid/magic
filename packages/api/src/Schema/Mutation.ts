import gql from "graphql-tag";

import * as Time from "~/time";

export const schema = gql`
  type Mutation {
    setTime(start: Date, stop: Date, narrative: String, tags: [String!]): Time!
  }
`;

interface Args {
  narrative: string | null;
  tags: string[] | null;
}

export const resolve = {
  setTime: (_source: never, args: Args) => ({
    narratives: [{ description: args.narrative }],
    tagOccurences: Time.Tag.fromNames(args.tags || []).map(tag => ({ tag }))
  })
};
