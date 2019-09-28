import { ApolloServer } from "apollo-server-lambda";

import * as Schema from "../Schema";

const handler = new ApolloServer({
  typeDefs: Schema.typeDefs,
  resolvers: Schema.resolvers,

  playground: true,
  introspection: true
}).createHandler({
  cors: {
    origin: "*"
  }
});

export { handler };
