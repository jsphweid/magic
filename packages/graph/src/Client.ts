import * as GraphQL from "graphql";
import { ApolloClient, InMemoryCache } from "apollo-boost";
import { SchemaLink } from "apollo-link-schema";

import * as Toggl from "~/toggl";

interface Secrets {
  toggl: Toggl.Secrets;
}

export const client = (schema: GraphQL.GraphQLSchema, secrets: Secrets) =>
  new ApolloClient({
    cache: new InMemoryCache(),
    link: new SchemaLink({ schema, context: { secrets } })
  });
