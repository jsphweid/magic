import gql from "graphql-tag";

import { Tag, Score } from "~/time";

export const schema = gql`
  type Tag implements Node {
    id: ID!
    name: String!
    score: Score!
    connections: [Tag!]!
  }

  enum Score {
    ${Score.names.join("\n")}
  }
`;

export type Source = Tag.Tag & {
  id: string;
};

export const resolve = {
  connections: (source: Source): Source[] =>
    Tag.allFromNames(source.connections).map(tag => ({
      id: source.id,
      ...tag
    }))
};
