import * as Express from "express";
import * as GraphQL from "graphql";
import { twiml as TWIML } from "twilio";

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
      body: "`From` is expected in the post body"
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

  const { sender, message } = validatedRequest.value;

  const operationSource = GraphQL.print(
    GraphQLOperation.documentFromMessage(schema, message)
  );

  const result = await GraphQL.graphql<any>({
    source: operationSource,
    schema
  });

  const reply = Reply.fromJSONValue({
    ...result,
    errors: Option.fromNullable(result.errors).fold(null, errors =>
      errors.map(({ message }) => message)
    )
  });

  const TWIML = replyToTWIML(sender, reply);
  respond(response, { ...responses.success, body: TWIML });
};

const validateRequest = (
  request: Express.Request
): Either.Either<Response, ValidRequest> =>
  validateSender(request).chain(sender =>
    Either.fromNullable(responses.errors.messageIsMissing)(
      request.body.Body
    ).map(message => ({ sender, message }))
  );

const validateSender = ({
  body
}: Express.Request): Either.Either<Response, string> =>
  Either.fromNullable(responses.errors.senderIsMissing)(body.From).chain(
    from =>
      from !== "+16185205959"
        ? Either.left(responses.errors.senderIsNotOwner)
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
