import gql from "graphql-tag";

export const schema = gql`
  type Narrative implements Node & HasInterval {
    id: ID!
    interval: Interval!
    description: String!
  }
`;
