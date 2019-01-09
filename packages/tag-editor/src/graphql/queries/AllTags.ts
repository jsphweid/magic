import gql from "graphql-tag";
import { RawTag } from "./Fragments";

export default gql`
  query AllTags {
    Tag {
      tags {
        ...RawTag
      }
    }
  }
  ${RawTag}
`;
