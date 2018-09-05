import { GraphQLServer } from "graphql-yoga";
import * as GraphQLTools from "graphql-tools";

import CORS from "cors";
import * as BodyParser from "body-parser";

import * as Functions from "firebase-functions";

import "./Config";

import * as Schema from "./Schema";
import * as Message from "./Message";

const schema = GraphQLTools.makeExecutableSchema({
  typeDefs: Schema.source,
  resolvers: Schema.resolvers
});

const server = new GraphQLServer({ schema })
  .use(CORS({ origin: true }))
  .post("/messages", BodyParser.json(), Message.handler(schema));

server.start(() => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Server started (http://localhost:4000)");
  }
});

exports.api = Functions.https.onRequest(server.express);
