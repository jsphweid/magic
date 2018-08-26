import * as Functions from "firebase-functions";

import { GraphQLServer } from "graphql-yoga";

import * as Schema from "./Schema";

if (process.env.NODE_ENV === "production") {
  const {
    toggl: { token: TOGGL_TOKEN, workspace: TOGGL_WORKSPACE }
  } = Functions.config();

  process.env = {
    ...process.env,
    TOGGL_TOKEN,
    TOGGL_WORKSPACE
  };
}

const server = new GraphQLServer({
  typeDefs: Schema.source,
  resolvers: Schema.resolvers
});

export const api = Functions.https.onRequest(server.express);

if (process.env.NODE_ENV !== "production") {
  server.start(() => console.log("Server is running on http://localhost:4000"));
}
