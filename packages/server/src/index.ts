import { GraphQLServer } from "graphql-yoga";

import * as Schema from "./Schema";

const server = new GraphQLServer({
  typeDefs: Schema.source,
  resolvers: Schema.resolvers,
  context: {
    secrets: {
      toggl: {
        token: `${process.env.TOGGL_TOKEN}`,
        workspaceId: `${process.env.TOGGL_WORKSPACE_ID}`
      }
    }
  }
});

server.start(() => console.log("Server is running on http://localhost:4000"));
