import "cross-fetch/polyfill";

import ApolloClient from "apollo-boost";

import * as Queries from "./Queries";

export interface Light {
  id: string;
  name: string;
}

const client = new ApolloClient({
  uri: "http://192.168.1.17:8080"
});

export const all = async () => {
  const {
    data: { lights }
  } = await client.query<{ lights: Light[] }>({
    query: Queries.allLights
  });

  return lights.map(({ id, name }) => ({ id, name }));
};

export const set = async (id: string, state: object) =>
  client.mutate({
    variables: { id, state },
    mutation: Queries.setLight
  });
