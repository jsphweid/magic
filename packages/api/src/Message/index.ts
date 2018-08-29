import * as GraphQL from "graphql";
import * as Express from "express";

import { ApolloClient } from "apollo-client";
import { InMemoryCache } from "apollo-cache-inmemory";
import { SchemaLink } from "apollo-link-schema";

import * as Twilio from "twilio";
import stringifyObject from "stringify-object";

import * as Operation from "./Operation";

export const handler = (schema: GraphQL.GraphQLSchema): Express.Handler => {
  const client = new ApolloClient({
    cache: new InMemoryCache({ addTypename: false }),
    link: new SchemaLink({ schema })
  });

  console.log(
    GraphQL.print(
      Operation.fromMessage(
        schema,
        "set time start in five minutes tags browsing, bathroom and body narrative Bathroom browsing"
      ).value
    )
  );

  return async (req, res) => {
    const { From: from, Body: message } = req.body;
    if (!from || !message) {
      return res.status(400).end();
    }

    if (process.env.TWILIO_NUMBERS_OWNER !== from) {
      return res.status(200).end();
    }

    const operation = Operation.fromMessage(schema, message).value;
    if (operation instanceof Error) {
      return messageResponse(res, from, "I couldn't understand your message.");
    }

    try {
      const { data }: { [key: string]: any } = await client.mutate({
        mutation: operation
      });

      const displayData =
        Object.keys(data).length === 1 ? data[Object.keys(data)[0]] : data;

      const formattedData = stringifyObject(displayData, { indent: " " });

      messageResponse(res, from, formattedData);
    } catch (e) {
      console.log(typeof e);
      messageResponse(res, from, e);
    }
  };
};

const messageResponse = (res: Express.Response, to: string, text: string) => {
  const twiml = new Twilio.twiml.MessagingResponse().message({ to }, text);

  res
    .status(200)
    .contentType("text/xml")
    .send(twiml.toString());
};
