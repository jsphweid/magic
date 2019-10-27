import { makeExecutableSchema } from "apollo-server-lambda";
import querystring from "querystring";

import { generateMessageHandler } from "./Message";
import { resolvers, typeDefs } from "./Schema";

exports.handler = async (event: any, _: any) => {
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const handler = generateMessageHandler(schema);

  let body;
  try {
    body = JSON.parse(event.body);
  } catch (_) {
    body = querystring.parse(event.body);
  }

  const response = await handler(body);

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
