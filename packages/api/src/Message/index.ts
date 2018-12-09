import * as Express from "express";
import { either as Either, option as Option } from "fp-ts";
import * as GraphQL from "graphql";
import { twiml as Twiml } from "twilio";

import * as Schema from "../Schema";
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
  errors: {
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
      body: "`Body` is expected in the post body"
    }
  },
  success: {
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

  const {
    value: { sender, message }
  } = validatedRequest;

  const { document, variables } = GraphQLOperation.fromMessage(message);

  const result = await GraphQL.graphql({
    source: GraphQL.print(document),
    variableValues: variables,
    contextValue: Schema.context(),
    schema
  });

  console.log(result);

  const reply = Reply.fromJson({
    data: Option.fromNullable<Reply.Json | null>(result.data).getOrElse(null),
    errors: Option.fromNullable(result.errors).fold(null, errors =>
      errors.map(({ message }) => message)
    )
  });

  const body = new Twiml.MessagingResponse()
    .message({ to: sender }, reply)
    .toString();

  respond(response, { ...responses.success, body });
};

const validateRequest = (
  request: Express.Request
): Either.Either<Response, ValidRequest> =>
  validateSender(request).chain(sender =>
    validateMessage(request).map(message => ({ sender, message }))
  );

const validateSender = (
  request: Express.Request
): Either.Either<Response, string> =>
  Either.fromNullable(responses.errors.senderIsMissing)(
    request.body.From
  ).chain(from =>
    from !== "+16185205959"
      ? Either.left(responses.errors.senderIsNotOwner)
      : Either.right(from)
  );

const validateMessage = (
  request: Express.Request
): Either.Either<Response, string> =>
  Either.fromNullable(responses.errors.messageIsMissing)(request.body.Body);

const respond = (
  response: Express.Response,
  { statusCode, contentType, body }: Response
) =>
  response
    .status(statusCode)
    .contentType(contentType)
    .send(body);
