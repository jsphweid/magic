import * as Path from "path";

import { importSchema } from "graphql-import";
import { GraphQLServer } from "graphql-yoga";

import { resolvers } from "./Resolvers";

const server = new GraphQLServer({
  typeDefs: importSchema(Path.resolve(__dirname, "Schema/Main.graphql")),

  // https://github.com/DefinitelyTyped/DefinitelyTyped/pull/22789
  resolvers: resolvers as any
});

server.start(() => console.log("Server is running on http://localhost:4000"));
