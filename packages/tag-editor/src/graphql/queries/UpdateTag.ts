import gql from "graphql-tag";
import { RawTag } from "./Fragments";

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
        ...RawTag
      }
    }
  }
  ${RawTag}
`;
