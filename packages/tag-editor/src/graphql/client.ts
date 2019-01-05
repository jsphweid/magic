import { InMemoryCache } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { onError } from "apollo-link-error";
import { HttpLink } from "apollo-link-http";

import { apiUrl, authHeader } from "../data";

const errorLink = onError((error: any) => {
  console.log(
    "network error message",
    error.networkError && JSON.stringify(error.networkError.message)
  );
  console.log("graphql error", JSON.stringify(error.graphQLErrors));
});

const httpLink = new HttpLink({
  fetch,
  uri: apiUrl,
  headers: {
    Authorization: authHeader
  }
});

const link = ApolloLink.from([errorLink, httpLink]);

export default new ApolloClient({
  link,
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: "no-cache"
    }
  }
});
