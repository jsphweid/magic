import gql from "graphql-tag";

export default gql`
  query AllTags {
    Tag {
      tags {
        ...Tag
        connections {
          ...Tag
          connections {
            ...Tag
            connections {
              ...Tag
              connections {
                ...Tag
                connections {
                  ...Tag
                }
              }
            }
          }
        }
      }
    }
  }
  fragment Tag on Tag__Tag {
    ID
    name
    aliases
    score
    aliases
  }
`;
