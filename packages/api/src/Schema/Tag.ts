import gql from "graphql-tag";

import * as Time from "~/time";

export const schema = gql`
  type Tag implements Node {
    id: ID!
    name: String!
    score: Score!
    connections: [Tag!]!
  }

  enum Score {
    ${Time.Score.names.join("\n")}
  }
`;

export type Source = Time.Tag.Tag & {
  id: string;
};

export const resolve = {
  connections: (source: Source): Source[] =>
    Time.Tag.allFromNames(source.connections).map(tag => ({
      id: source.id,
      ...tag
    }))
};
