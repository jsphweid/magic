import { ApolloServer } from "apollo-server-express";
import * as BodyParser from "body-parser";
import Cors from "cors";
import express from "express";
import BasicAuth from "express-basic-auth";
import * as GraphQLTools from "graphql-tools";

import "./Config";
import * as Message from "./Message";
import * as Schema from "./Schema";

export const schema = GraphQLTools.makeExecutableSchema({
  typeDefs: Schema.typeDefs,
  resolvers: Schema.resolvers
});

const server = new ApolloServer({ schema, context: () => Schema.context() });

const app = express();

app
  .options("*", Cors())
  .post("/messages", BodyParser.json(), Message.handler(schema));

// Disable authentication for local testing
if (process.env.NODE_ENV !== "dev") {
  app.post(
    "/graphql",
    BasicAuth({
      users: { api: `${process.env.MAGIC_API_TOKEN}` }
    })
  );
}

server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log("Server running at http://localhost:4000")
);
