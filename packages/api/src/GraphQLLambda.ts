import { ApolloServer } from "apollo-server-lambda";

import * as Schema from "./Schema";

const handler = new ApolloServer({
  typeDefs: Schema.typeDefs,
  resolvers: Schema.resolvers,
  context: () => Schema.context(),
  playground: true,
  introspection: true
}).createHandler({
  cors: {
    origin: "*"
  }
});

export { handler };
