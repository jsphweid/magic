import gql from "graphql-tag";

import * as Time from "./Time";

export const schema = gql`
  interface Node__Identifiable {
    ID: ID!
  }

  interface Node__Persisted {
    metadata: Node__PersistenceMetadata!
  }

  type Node__PersistenceMetadata {
    created: Time__FormattedDate!
    updated: Time__FormattedDate!
  }
`;

export interface Identifiable {
  ID: string;
}

export interface Persisted {
  metadata: PersistenceMetadata;
}

export interface PersistenceMetadata {
  created: Time.Date;
  updated: Time.Date;
}

export const resolvers = {
  Node__Identifiable: {
    __resolveType: () => "Node__Identifiable"
  },

  Node__Persisted: {
    __resolveType: () => "Node__Persisted"
  }
};
