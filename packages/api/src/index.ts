import * as BodyParser from "body-parser";
import Cors from "cors";
import BasicAuth from "express-basic-auth";
import * as Functions from "firebase-functions";
import * as GraphQLTools from "graphql-tools";
import { GraphQLServer } from "graphql-yoga";

import "./Config";
import * as Hue from "./Hue";
import * as Message from "./Message";
import * as Schema from "./Schema";

const schema = GraphQLTools.makeExecutableSchema({
  typeDefs: Schema.source,
  resolvers: Schema.resolvers
});

const server = new GraphQLServer({ schema, context: Schema.context });
const authentication = BasicAuth({
  users: { api: `${process.env.MAGIC_API_TOKEN}` }
});

server.express
  .options("*", Cors())
  .get("/hue-login", Hue.loginHandler)
  .post("/messages", BodyParser.json(), Message.handler(schema))
  .post("/graphql", authentication);

server.start(
  { endpoint: "/graphql" },

  // tslint:disable-next-line:no-console
  () => console.log("Server running at http://localhost:4000")
);

exports.api = Functions.https.onRequest(server.express);
