import gql from "graphql-tag";

export const schema = gql`
  type Action__Action implements Node__Identifiable & Node__Persisted {
    ID: ID!
    meta: Node__Meta!
  }
`;
