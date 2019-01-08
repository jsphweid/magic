import gql from "graphql-tag";

export default gql`
  mutation DeleteTag($id: ID!) {
    Tag {
      delete(ID: $id)
    }
  }
`;
