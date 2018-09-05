import { GraphQLServer } from "graphql-yoga";
import * as GraphQLTools from "graphql-tools";

import CORS from "cors";
import BasicAuth from "express-basic-auth";
import * as BodyParser from "body-parser";

import * as Functions from "firebase-functions";

import "./Config";

import * as Schema from "./Schema";
import * as Message from "./Message";

const schema = GraphQLTools.makeExecutableSchema({
  typeDefs: Schema.source,
  resolvers: Schema.resolvers
});

const server = new GraphQLServer({ schema });

server.express
  .options("*", CORS())
  .post("/messages", BodyParser.json(), Message.handler(schema))
  .post("/graphql", BasicAuth({ users: { api: `${process.env.API_TOKEN}` } }));

server.start(
  {
    endpoint: "/graphql",
    playground: process.env.NODE_ENV !== "production" ? "/playground" : false
  },
  () =>
    process.env.NODE_ENV !== "production" &&
    console.log("http://localhost:4000/playground")
);

exports.api = Functions.https.onRequest(server.express);
