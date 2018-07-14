import "cross-fetch/polyfill";

import ApolloClient from "apollo-boost";

import * as Queries from "./Queries";

const client = new ApolloClient({
  uri: "http://192.168.1.17:8080"
});

// TODO: use codegen
interface AllLights {
  lights: Array<{
    id: string;
    name: string;
    __typename: string;
  }>;
}

export const all = async () => {
  const {
    data: { lights }
  } = await client.query<AllLights>({
    query: Queries.allLights
  });

  return lights.map(({ id, name }) => ({ id, name }));
};

export const set = async (id: string, state: object) =>
  client.mutate({
    variables: { id, state },
    mutation: Queries.setLight
  });
