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

export const Tag = gql`
  fragment Tag on Tag__Tag {
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
