import gql from "graphql-tag";

export const schema = gql`
  type Mutation {
    setTime(narrative: String, tags: [String]!): Time!

    setNarrative(text: String): Time!
    addTags(tags: [String!]!): Time!
    removeTags(tags: [String!]): Time!
  }
`;
