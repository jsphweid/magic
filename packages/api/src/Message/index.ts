import { Either, Fn, Option, pipe } from "@grapheng/prelude";
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

interface RequestBody {
  From: string;
  Body: string;
}

export const generateMessageHandler = (schema: GraphQL.GraphQLSchema) => async (
  requestBody: RequestBody
): Promise<Response> => {
  const validatedRequest = validateRequest(requestBody);
  if (Either.isLeft(validatedRequest)) {
    return validatedRequest.left;
  }

  const {
    right: { sender, message }
  } = validatedRequest;

  const { document, variables } = GraphQLOperation.fromMessage(message);

  const result = await GraphQL.graphql({
    source: GraphQL.print(document),
    variableValues: variables,
    contextValue: await Schema.context(),
    schema
  });

  // Option.fromNullable<Reply.Json | null>(result.data).getOrElse(null),

  const reply = Reply.fromJson({
    data: pipe(
      Option.fromNullable<Reply.Json | null>(result.data),
      Option.fold(Fn.constNull, Fn.identity)
    ),
    errors: pipe(
      Option.fromNullable(result.errors),
      Option.fold(Fn.constNull, errors => errors.map(({ message }) => message))
    )
  });

  const body = new Twiml.MessagingResponse()
    .message({ to: sender }, reply)
    .toString();

  return { ...responses.success, body };
};

const validateRequest = (
  body: RequestBody
): Either.Either<Response, ValidRequest> =>
  pipe(
    validateSender(body),
    Either.chain(sender =>
      pipe(
        validateMessage(body),
        Either.map(message => ({ sender, message }))
      )
    )
  );

const validateSender = (body: RequestBody): Either.Either<Response, string> =>
  pipe(
    body.From,
    Either.fromNullable(responses.errors.senderIsMissing),
    Either.chain(from =>
      from !== process.env.TWILIO_NUMBERS_OWNER
        ? Either.left(responses.errors.senderIsNotOwner)
        : Either.right(from)
    )
  );

const validateMessage = (body: RequestBody): Either.Either<Response, string> =>
  Either.fromNullable(responses.errors.messageIsMissing)(body.Body);
