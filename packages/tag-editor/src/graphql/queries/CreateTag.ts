import gql from "graphql-tag";
import { RawTag } from "./Fragments";

export default gql`
  mutation CreateTag($name: String!) {
    Tag {
      create(name: $name) {
        ...RawTag
      }
    }
  }
  ${RawTag}
`;
