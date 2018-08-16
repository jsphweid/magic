import "cross-fetch/polyfill";

import gql from "graphql-tag";
import ApolloClient from "apollo-boost";

const client = new ApolloClient({ uri: "http://192.168.1.7:8080" });

export interface Light {
  id: string;
  name: string;
}

export const all = async (): Promise<Light[]> => {
  const query = gql`
    {
      lights {
        id
        name
      }
    }
  `;

  const result = await client.query<{ lights: Light[] }>({ query });
  return result.data.lights;
};

export const set = async (id: string, state: object): Promise<Light | null> => {
  const mutation = gql`
    mutation($id: ID!, $state: LightState!) {
      setLightState(id: $id, state: $state) {
        color
      }
    }
  `;

  const result = await client.mutate<Light>({
    variables: { id, state },
    mutation
  });

  if (!result || !result.data) {
    return null;
  }

  return result.data as Light;
};
