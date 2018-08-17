import * as GraphQLTools from "graphql-tools";
import { GraphQLServer } from "graphql-yoga";

import * as Graph from "~/graph";

const schema: any = GraphQLTools.makeExecutableSchema(Graph.schema);

const server = new GraphQLServer({
  schema,
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
