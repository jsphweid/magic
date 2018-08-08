import gql from "graphql-tag";

export const schema = gql`
  type TagOccurence implements Node & HasInterval {
    id: ID!
    interval: Interval!
    tag: Tag!
  }
`;
