import { GraphQLServer } from "graphql-yoga";

import * as Graph from "~/graph";

const server = new GraphQLServer({
  typeDefs: Graph.Schema.source,

  // https://github.com/DefinitelyTyped/DefinitelyTyped/pull/22789
  resolvers: Graph.Schema.resolvers as any
});

server.start(() => console.log("Server is running on http://localhost:4000"));
