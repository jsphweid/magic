import _ from "lodash/fp";

import * as GraphQL from "graphql";
import * as Express from "express";

import { twiml as TWIML } from "twilio";

import { either as Either, option as Option } from "fp-ts";

import * as GraphQLOperation from "./GraphQLOperation";
import * as Reply from "./Reply";

interface ValidRequest {
  sender: string;
  message: string;
}

interface Response {
  statusCode: number;
  contentType: string;
  body: string;
}

const responses = {
  senderIsMissing: {
    statusCode: 400,
    contentType: "text/plain",
    body: "`From` is expected in the post body"
  },
  senderIsNotOwner: {
    statusCode: 403,
    contentType: "text/plain",
    body: "You're not allowed to send messages here"
  },
  messageIsMissing: {
    statusCode: 400,
    contentType: "text/plain",
    body: "`From` is expected in the post body"
  },

  TWIML: {
    statusCode: 200,
    contentType: "text/xml"
  }
};

export const handler = (
  schema: GraphQL.GraphQLSchema
): Express.Handler => async (request, response) => {
  const validatedRequest = validateRequest(request);
  if (validatedRequest.isLeft()) {
    return respond(response, validatedRequest.value);
  }

  const { sender, message } = validatedRequest.value;
  const operationSource = GraphQL.print(
    GraphQLOperation.documentFromMessage(schema, message)
  );

  const { data, errors } = await GraphQL.graphql({
    source: operationSource,
    schema
  });

  const reply = Reply.fromJSON({
    data: data || null,
    errors: Option.fromNullable(errors).fold(null, errors =>
      errors.map(({ message }) => message)
    )
  });

  respond(response, {
    statusCode: 200,
    contentType: "text/xml",
    body: replyToTWIML(sender, reply)
  });
};

const validateRequest = (
  request: Express.Request
): Either.Either<Response, ValidRequest> =>
  validateSender(request).chain(sender =>
    Either.fromNullable(responses.messageIsMissing)(request.body.Body).map(
      message => ({ sender, message })
    )
  );

const validateSender = ({
  body
}: Express.Request): Either.Either<Response, string> =>
  Either.fromNullable(responses.senderIsMissing)(body.From).chain(
    from =>
      from !== "+16185205959"
        ? Either.left(responses.senderIsNotOwner)
        : Either.right(from)
  );

const replyToTWIML = (to: string, reply: string): string =>
  new TWIML.MessagingResponse().message({ to }, reply).toString();

const respond = (
  response: Express.Response,
  { statusCode, contentType, body }: Response
) =>
  response
    .status(statusCode)
    .contentType(contentType)
    .send(body);
