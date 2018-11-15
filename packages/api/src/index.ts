import * as BodyParser from "body-parser";
import Cors from "cors";
import BasicAuth from "express-basic-auth";
import * as Functions from "firebase-functions";
import * as GraphQLTools from "graphql-tools";
import { GraphQLServer } from "graphql-yoga";

import "./Config";
import * as Message from "./Message";
import * as Schema from "./Schema";

const schema = GraphQLTools.makeExecutableSchema({
  typeDefs: Schema.source,
  resolvers: Schema.resolvers
});

const server = new GraphQLServer({ schema, context: Schema.context });

server.express
  .options("*", Cors())
  .post("/messages", BodyParser.json(), Message.handler(schema))
  .post(
    "/graphql",
    BasicAuth({
      users: {
        api: `${process.env.MAGIC_API_TOKEN}`
      }
    })
  );

server.start(
  { endpoint: "/graphql" },

  // tslint:disable-next-line:no-console
  () => console.log("Server running...")
);

exports.api = Functions.https.onRequest(server.express);
