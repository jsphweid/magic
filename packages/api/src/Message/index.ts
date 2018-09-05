import * as GraphQL from "graphql";
import * as Express from "express";
import * as Twilio from "twilio";

import * as Operation from "./Operation";
import * as Reply from "./Reply";

export const handler = (schema: GraphQL.GraphQLSchema): Express.Handler => {
  return async (req, res) => {
    const { From: from, Body: message } = req.body as {
      From?: string | null;
      Body?: string | null;
    };

    if (!from || !message) {
      return res.status(400).end();
    }

    const twiml = new Twilio.twiml.MessagingResponse();
    res.status(200).contentType("text/xml");

    if (process.env.TWILIO_NUMBERS_OWNER !== from) {
      return res.send(twiml.toString());
    }

    const operation = Operation.fromMessage(schema, message);
    const result = await GraphQL.graphql({
      schema,
      source: GraphQL.print(operation)
    });

    res.send(
      twiml
        .message({ to: from }, Reply.fromOperationResult(operation, result))
        .toString()
    );
  };
};
