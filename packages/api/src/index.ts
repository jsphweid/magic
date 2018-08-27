import * as Functions from "firebase-functions";

import { GraphQLServer } from "graphql-yoga";

import * as Schema from "./Schema";
import * as Twilio from "./Twilio";

if (process.env.NODE_ENV === "production") {
  const {
    toggl: { token: TOGGL_TOKEN, workspace_id: TOGGL_WORKSPACE_ID },
    twilio: { owner_number: TWILIO_OWNER_NUMBER }
  } = Functions.config();

  process.env = {
    ...process.env,
    TOGGL_TOKEN,
    TOGGL_WORKSPACE_ID,
    TWILIO_OWNER_NUMBER
  };
}

const server = new GraphQLServer({
  typeDefs: Schema.source,
  resolvers: Schema.resolvers
});

server.express.post("/twilio", Twilio.handler);

export const api = Functions.https.onRequest(server.express);

if (process.env.NODE_ENV !== "production") {
  server.start(() => console.log("Server is running on http://localhost:4000"));
}
