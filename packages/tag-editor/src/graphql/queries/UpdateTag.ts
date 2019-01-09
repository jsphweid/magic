import gql from "graphql-tag";
import { Tag } from "./Fragments";

export default gql`
  mutation UpdateTag(
    $ID: ID!
    $name: String!
    $aliases: [String!]
    $score: Int
    $connections: [String!]
  ) {
    Tag {
      update(
        ID: $ID
        name: $name
        aliases: $aliases
        score: $score
        connections: $connections
      ) {
        ...Tag
      }
    }
  }
  ${Tag}
`;
