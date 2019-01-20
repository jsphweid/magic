import gql from "graphql-tag";
import { Tag } from "./Fragments";

export default gql`
  mutation CreateTag($name: String!) {
    Tag {
      create(name: $name) {
        ...Tag
      }
    }
  }
  ${Tag}
`;
