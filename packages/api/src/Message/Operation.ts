import * as GraphQL from "graphql";
import gql from "graphql-tag";

import { either as Either } from "fp-ts";

export const fromMessage = (
  schema: GraphQL.GraphQLSchema,
  message: string
): Either.Either<Error, GraphQL.DocumentNode> =>
  messageToRootField(schema, message).chain(rootField => {
    if (rootField.args.length === 0) {
      return Either.right(gql`{ ${rootField.name} }`);
    }

    const args = messageToArgs(rootField, message)
      .map(({ name, value }) => `${name}: ${value}`)
      .join(", ");

    const outputType = GraphQL.getNamedType(rootField.type);
    const selection =
      GraphQL.isObjectType(outputType) && outputType.name === "Time"
        ? "{ ...Now }"
        : "";

    return Either.right(gql`
      mutation {
        ${rootField.name}${args.length > 0 ? `(${args})` : ""} ${selection ||
      ""}
      }

      ${selection !== "" ? GraphQL.print(fragments) : ""}
    `);
  });

const messageToRootField = (
  schema: GraphQL.GraphQLSchema,
  message: string
): Either.Either<Error, GraphQL.GraphQLField<unknown, unknown>> => {
  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType();

  if (!queryType && !mutationType) {
    return Either.left(new Error("`Query` and `Mutation` aren't defined"));
  }

  const rootField = [
    ...Object.values(queryType ? queryType.getFields() : {}),
    ...Object.values(mutationType ? mutationType.getFields() : {})
  ].find(
    field => message.toLowerCase().indexOf(nameToInputFormat(field.name)) === 0
  );

  return rootField
    ? Either.right(rootField)
    : Either.left(
        new Error(
          `No field from \`Query\` or \`Mutation\` is at the beginning of the message`
        )
      );
};

const messageToArgs = (
  rootField: GraphQL.GraphQLField<unknown, unknown>,
  message: string
): Array<{ name: string; value: string }> =>
  rootField.args.map(arg => ({
    name: arg.name,
    value: messageToArgValue(rootField, arg, message)
  }));

const messageToArgValue = (
  rootField: GraphQL.GraphQLField<unknown, unknown>,
  arg: GraphQL.GraphQLArgument,
  message: string
): string => {
  const argNameAsInputFormat = nameToInputFormat(arg.name);
  const argNameStartIndex = message.toLowerCase().indexOf(argNameAsInputFormat);

  if (argNameStartIndex <= 0) {
    return "null";
  }

  const argValueStartIndex = argNameStartIndex + argNameAsInputFormat.length;
  const nextArgNameStartIndex = rootField.args
    .map(
      rootFieldArg =>
        rootFieldArg !== arg
          ? message.indexOf(nameToInputFormat(rootFieldArg.name))
          : -1
    )
    .filter(index => index >= argValueStartIndex)
    .sort((a, b) => (a > b ? 1 : -1))[0];

  const value = message
    .slice(
      argValueStartIndex,
      nextArgNameStartIndex >= 0 ? nextArgNameStartIndex : undefined
    )
    .trim();

  return `${JSON.stringify(value)}`;
};

const nameToInputFormat = (name: string): string =>
  name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();

const fragments = gql`
  fragment Now on Time {
    ...Interval
    narratives {
      ...Interval
      description
    }
    tagOccurrences {
      ...Interval
      tag {
        name
        score
      }
    }
  }

  fragment Interval on HasInterval {
    interval {
      start
      stop
    }
  }
`;
