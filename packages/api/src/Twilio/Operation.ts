import * as GraphQL from "graphql";
import gql from "graphql-tag";

export const fromMessage = (
  schema: GraphQL.GraphQLSchema,
  message: string
): GraphQL.DocumentNode | null => {
  const queryType = schema.getQueryType();
  const mutationType = schema.getMutationType();

  if (!queryType || !mutationType) {
    return null;
  }

  const rootField = Object.values({
    ...queryType.getFields(),
    ...mutationType.getFields()
  }).find(
    field => message.toLowerCase().indexOf(nameToInputFormat(field.name)) === 0
  );

  if (!rootField) {
    return null;
  }

  if (rootField.args.length === 0) {
    return gql`{ ${rootField.name} }`;
  }

  const args = rootField.args.map(
    arg =>
      `${arg.name}: ${parseArgValue(
        removeName(rootField.name, message),
        rootField.args,
        arg
      )}`
  );

  return gql`
    {
      ${rootField.name}(${args.join(" ")})
    }
  `;
};

const nameToInputFormat = (name: string): string =>
  name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();

const removeName = (name: string, value: string): string => {
  const nameAsInputFormat = nameToInputFormat(name);

  const indexOfName = value
    .toLowerCase()
    .indexOf(nameAsInputFormat.toLowerCase());

  if (indexOfName < 0) {
    return value;
  }

  return value.substring(indexOfName + nameAsInputFormat.length);
};

const parseArgValue = (
  messageWithoutFieldName: string,
  args: GraphQL.GraphQLArgument[],
  argToParse: GraphQL.GraphQLArgument
): string | number | null => {
  const messageWithoutArgName = removeName(
    argToParse.name,
    messageWithoutFieldName
  );

  if (messageWithoutArgName === messageWithoutFieldName) {
    return null;
  }

  const nextArg = args
    .filter(arg => arg !== argToParse)
    .map(arg => ({
      arg,
      index: messageWithoutArgName.indexOf(nameToInputFormat(arg.name))
    }))
    .filter(({ index }) => index !== -1)
    .sort((a, b) => (a.index > b.index ? 1 : -1))[0];

  const value = messageWithoutArgName
    .slice(0, nextArg ? nextArg.index : undefined)
    .trim();

  if (GraphQL.isScalarType(argToParse.type)) {
    const parsedValue = argToParse.type.parseValue(value);
    return typeof parsedValue === "string" ? `"${parsedValue}"` : parsedValue;
  }

  return `"${value}"`;
};
