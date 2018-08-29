import { GraphQLServer } from "graphql-yoga";
import * as GraphQLTools from "graphql-tools";
import * as BodyParser from "body-parser";

import * as Functions from "firebase-functions";

import "./Config";

import * as Schema from "./Schema";
import * as Message from "./Message";

const schema = GraphQLTools.makeExecutableSchema({
  typeDefs: Schema.source,
  resolvers: Schema.resolvers
});

const server = new GraphQLServer({ schema }).post(
  "/messages",
  BodyParser.json(),
  Message.handler(schema)
);

export const api = Functions.https.onRequest(server.express);

if (process.env.NODE_ENV !== "production") {
  server.start(() => console.log("Server is running on http://localhost:4000"));
}
