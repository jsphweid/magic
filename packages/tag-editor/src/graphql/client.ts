import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { HttpLink } from "apollo-link-http";

import { apiUrl, authHeader } from "../data";

const httpLink = new HttpLink({
  fetch,
  uri: apiUrl,
  headers: {
    Authorization: authHeader
  }
});

const link = ApolloLink.from([httpLink]);

export default new ApolloClient({
  link,
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: "no-cache"
    }
  }
});
