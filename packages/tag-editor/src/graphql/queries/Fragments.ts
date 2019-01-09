import gql from "graphql-tag";

const baseTag = gql`
  fragment BaseTag on Tag__Tag {
    ID
    name
    aliases
    score
    aliases
  }
`;

export const RawTag = gql`
  fragment RawTag on Tag__Tag {
    ...BaseTag
    connections {
      ...BaseTag
      connections {
        ...BaseTag
        connections {
          ...BaseTag
          connections {
            ...BaseTag
            connections {
              ...BaseTag
            }
          }
        }
      }
    }
  }
  ${baseTag}
`;
