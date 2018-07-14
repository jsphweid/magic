import gql from "graphql-tag";

export const allLights = gql`
  query AllLights {
    lights {
      id
      name
    }
  }
`;

export const setLight = gql`
  mutation SetLight($id: ID!, $state: LightState!) {
    setLightState(id: $id, state: $state) {
      color
    }
  }
`;
