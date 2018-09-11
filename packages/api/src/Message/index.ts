import * as GraphQL from "graphql";
import * as Express from "express";

import { twiml as TWIML } from "twilio";

import * as GraphQLOperation from "./GraphQLOperation";
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

    if (process.env.TWILIO_NUMBERS_OWNER !== from) {
      return res.status(403).end();
    }

    // tslint:disable-next-line:no-console
    console.log(message);

    // Run the message as a GraphQL operation against the schema
    const operation = GraphQLOperation.sourceFromMessage(schema, message);
    const source = GraphQL.print(operation);
    const { data, errors } = await GraphQL.graphql<{ data: any }>({
      schema,
      source
    });

    // Make sure `data` is defined and format `errors` to only include `message`
    const reply = Reply.fromResult({
      data: data || null,
      errors: errors === undefined ? null : errors.map(({ message }) => message)
    });

    // Generate the Twilio XML needed to create a message
    const body = new TWIML.MessagingResponse()
      .message({ to: from }, reply)
      .toString();

    return res
      .status(200)
      .contentType("text/xml")
      .send(body);
  };
};
