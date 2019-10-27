import { makeExecutableSchema } from "apollo-server-lambda";

import { generateMessageHandler } from "./Message";
import { resolvers, typeDefs } from "./Schema";

exports.handler = async (event: any, _: any) => {
  console.log("event", event);
  console.log("making schema");
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  console.log("making handler");
  const handler = generateMessageHandler(schema);
  console.log("executing");
  const response = await handler(JSON.parse(event.body));

  const reformedResponse = {
    statusCode: response.statusCode,
    headers: {
      "Content-Type": response.contentType
    },
    body: response.body
  };

  if (response.statusCode === 200) {
    return Promise.resolve(reformedResponse);
  } else {
    return Promise.reject(reformedResponse);
  }
};
