import { GraphQLServer } from "graphql-yoga";

import { schema, resolvers } from "./Schema";

const server = new GraphQLServer({
  typeDefs: schema,

  // https:// github.com/DefinitelyTyped/DefinitelyTyped/pull/22789
  resolvers: resolvers as any
});

server.start(() => console.log("Server is running on http://localhost:4000"));
