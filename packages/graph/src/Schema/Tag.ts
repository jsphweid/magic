import gql from "graphql-tag";

import * as Time from "~/time";

export const schema = gql`
  type Tag implements Node {
    id: ID!
    name: String!
    score: Score!
    connections: [Tag!]
  }

  enum Score {
    ${Time.Score.names.join("\n")}
  }
`;

export type Source = Time.Tag.Tag & {
  id: string;
};
