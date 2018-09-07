import * as GraphQL from "graphql";
import gql from "graphql-tag";

import * as Time from "./Time";

export const fromMessage = (
  schema: GraphQL.GraphQLSchema,
  message: string
): GraphQL.DocumentNode => {
  const { parentType, rootField } = messageToRootField(schema, message);

  const operation = parentType.name === "Query" ? "query" : "mutation";

  const args = messageToArgs(rootField, message)
    .map(({ name, value }) => `${name}: ${value}`)
    .join(", ");

  const outputType = GraphQL.getNamedType(rootField.type);
  const selection =
    GraphQL.isObjectType(outputType) && outputType.name === "Time"
      ? `{ ${Time.selection} }`
      : "{}";

  return gql`
    ${operation} {
      ${rootField.name}${args.length > 0 ? `(${args})` : ""} ${selection}
    }

    ${selection !== "{}" ? GraphQL.print(Time.fragments) : ""}
  `;
};

const messageToRootField = (
  schema: GraphQL.GraphQLSchema,
  message: string
): {
  parentType: GraphQL.GraphQLObjectType;
  rootField: GraphQL.GraphQLField<unknown, unknown>;
} => {
  // these are definitely defined in the schema
  const queryType = schema.getQueryType() as GraphQL.GraphQLObjectType;
  const mutationType = schema.getMutationType() as GraphQL.GraphQLObjectType;

  const queryFields = Object.values(queryType.getFields());
  const mutationFields = Object.values(queryType.getFields());

  const rootFields = [
    ...queryFields.map(rootField => ({ parentType: queryType, rootField })),
    ...mutationFields.map(rootField => ({
      parentType: mutationType,
      rootField
    }))
  ];

  const rootField = rootFields.find(
    ({ rootField }) =>
      message.toLowerCase().indexOf(nameToWords(rootField.name)) === 0
  );

  return rootField
    ? rootField
    : {
        parentType: mutationType,
        rootField: mutationType.getFields().startTime
      };
};

const messageToArgs = (
  rootField: GraphQL.GraphQLField<unknown, unknown>,
  message: string
): Array<{ name: string; value: string }> =>
  rootField.args.map(arg => ({
    name: arg.name,
    value: messageToArgValue(
      rootField,
      arg,

      arg.name === "narrative" && !message.toLowerCase().includes("narrative")
        ? `narrative ${message}`
        : message
    )
  }));

const messageToArgValue = (
  rootField: GraphQL.GraphQLField<unknown, unknown>,
  arg: GraphQL.GraphQLArgument,
  message: string
): string => {
  const argNameAsInputFormat = nameToWords(arg.name);
  const argNameStartIndex = message.toLowerCase().indexOf(argNameAsInputFormat);

  if (argNameStartIndex < 0) {
    return "null";
  }

  const argValueStartIndex = argNameStartIndex + argNameAsInputFormat.length;
  const nextArgNameStartIndex = rootField.args
    .map(
      rootFieldArg =>
        rootFieldArg !== arg
          ? message.indexOf(nameToWords(rootFieldArg.name))
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

  if (GraphQL.isListType(arg.type)) {
    const items = value.includes(", ") ? value.split(", ") : value.split(" ");
    return `[${items.map(value => JSON.stringify(value)).join(", ")}]`;
  }

  return JSON.stringify(value);
};

const nameToWords = (name: string): string =>
  name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
