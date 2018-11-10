import * as BodyParser from "body-parser";
import CORS from "cors";
// import BasicAuth from "express-basic-auth";
import Firebase from "firebase";
import * as Functions from "firebase-functions";
import * as GraphQLTools from "graphql-tools";
import { GraphQLServer } from "graphql-yoga";

import "./Config";

Firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
});

Firebase.firestore().settings({
  timestampsInSnapshots: true
});

import * as Message from "./Message";
import * as Schema from "./Schema";

const schema = GraphQLTools.makeExecutableSchema({
  typeDefs: Schema.source,
  resolvers: Schema.resolvers
});

const server = new GraphQLServer({ schema });

server.express
  .options("*", CORS())
  .post("/messages", BodyParser.json(), Message.handler(schema));
// .post("/graphql", BasicAuth({ users: { api: `${process.env.API_TOKEN}` } }));

server.start(
  { endpoint: "/graphql" },

  // tslint:disable-next-line:no-console
  () => console.log("Server running...")
);

exports.api = Functions.https.onRequest(server.express);
