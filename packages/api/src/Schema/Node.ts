import gql from "graphql-tag";

import * as Time from "./Time";

export const typeDefs = gql`
  interface Node__Identifiable {
    ID: ID!
  }

  interface Node__Persisted {
    meta: Node__Meta!
  }

  type Node__Meta {
    created: FormattedDate!
    updated: FormattedDate!
  }
`;

export interface Identifiable {
  ID: string;
}

export interface Persisted {
  meta: PersistenceMeta;
}

export interface PersistenceMeta {
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
