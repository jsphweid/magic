import gql from "graphql-tag";
import { Tag } from "./Fragments";

export default gql`
  query AllTags {
    Tag {
      tags {
        ...Tag
      }
    }
  }
  ${Tag}
`;
