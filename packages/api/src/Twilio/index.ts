import * as GraphQL from "graphql";
import * as Express from "express";

import * as Operation from "./Operation";

export const handler = (schema: GraphQL.GraphQLSchema): Express.Handler => (
  req,
  res
) => {
  const { From: sender, Body: message } = req.body;

  if (process.env.TWILIO_OWNER_NUMBER !== sender) {
    return res.status(200);
  }

  Operation.fromMessage(schema, message);

  console.log({
    message,
    operation: GraphQL.print(Operation.fromMessage(schema, message))
  });

  res.status(200);
};
