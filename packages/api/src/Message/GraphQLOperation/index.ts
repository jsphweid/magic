import * as GraphQL from "graphql";
import gql from "graphql-tag";

import * as Selection from "./Selection";

/*
  Transfrom an SMS message into GraphQL operation source code to run against
  the schema
*/
export const documentFromMessage = (
  schema: GraphQL.GraphQLSchema,
  message: string
): GraphQL.DocumentNode => {
  /*
    Match the start of the message start with a root field on either `Query` or
    `Mutation`
  */
  const { parentType, rootField } = messageToRootField(schema, message);
  const operation = parentType.name === "Query" ? "query" : "mutation";

  // Parse arguments to pass into the root field and stringify them as GraphQL
  const args = messageToArgs(rootField, message)
    .map(({ name, value }) => `${name}: ${value}`)
    .join(", ");

  /*
    If we're selecting a root field which returns `Time`, use the default
    time selection i.e. `...Time`
  */
  const outputType = GraphQL.getNamedType(rootField.type);
  const selection =
    GraphQL.isObjectType(outputType) && outputType.name === "Time"
      ? `{ ${Selection.time} }`
      : "{}";

  /*
    Print the operation as GraphQL source code and if needed include the
    fragments for the default `Time` selection
  */
  return gql`
    ${operation} {
      ${rootField.name}${args.length > 0 ? `(${args})` : ""} ${selection}
    }

    ${selection !== "{}" ? GraphQL.print(Selection.fragments) : ""}
  `;
};

const messageToRootField = (
  schema: GraphQL.GraphQLSchema,
  message: string
): {
  parentType: GraphQL.GraphQLObjectType;
  rootField: GraphQL.GraphQLField<unknown, unknown>;
} => {
  /*
    `Query` and `Mutation` are definitely defined in the schema, no need to
    error-check
  */
  const queryType = schema.getQueryType() as GraphQL.GraphQLObjectType;
  const mutationType = schema.getMutationType() as GraphQL.GraphQLObjectType;

  // Grab all the root fields on the `Query` and `Mutation` types
  const queryFields = Object.values(queryType.getFields());
  const mutationFields = Object.values(queryType.getFields());

  // Make a list of root fields and their parent types
  const rootFields = [
    ...queryFields.map(rootField => ({ parentType: queryType, rootField })),
    ...mutationFields.map(rootField => ({
      parentType: mutationType,
      rootField
    }))
  ];

  // Find the root field where its name matches the start of the message
  const rootField = rootFields.find(
    ({ rootField }) =>
      message.toLowerCase().indexOf(nameToWords(rootField.name)) === 0
  );

  /*
    Use the root field we found or default to `Mutation.setTime`...

    "time" => parentType is `Query` and rootField is `time`
    "driving home" => parentType is `Mutation` and rootField is `setTime`
    "stopTags browsing" => parentType is `Mutation` and rootField is `stopTags`
  */
  return rootField
    ? rootField
    : {
        parentType: mutationType,
        rootField: mutationType.getFields().setTime
      };
};

/*
  For all of the args we have in the root field, return their names and parsed
  values from the message
*/
const messageToArgs = (
  rootField: GraphQL.GraphQLField<unknown, unknown>,
  message: string
): Array<{ name: string; value: string }> =>
  rootField.args.map(arg => ({
    name: arg.name,
    value: messageToArgValue(
      rootField,
      arg,

      /*
        Since the short-hand `Mutation.setTime` message looks like...
        - "bathroom"
        - "cutting the grass"
        - "cooking dinner tags cooking, not dinner"

        ...if we don't see the `narrative` argument in the message, we need to
        prepend it...
        - "narrative bathroom"
        - "narrative cutting the grass"
        - "narrative cooking dinner tags cooking, not dinner"
      */
      arg.name === "narrative" && !message.toLowerCase().includes("narrative")
        ? `narrative ${message}`
        : message
    )
  }));

/*
  Parse the message into the value of an argument on the root field. If the
  message is "walking the dog start five minutes ago" and we're trying to get
  the value of start, the result should be "five minutes ago".
*/
const messageToArgValue = (
  rootField: GraphQL.GraphQLField<unknown, unknown>,
  arg: GraphQL.GraphQLArgument,
  message: string
): string => {
  /*
    What is the starting location of the argument name? If it wasn't provided
    the argument is "null"
  */
  const argNameAsInputFormat = nameToWords(arg.name);
  const argNameStartIndex = message.toLowerCase().indexOf(argNameAsInputFormat);

  if (argNameStartIndex < 0) return "null";

  /*
    What is the starting location (index) of the next argument?
    
    If we are trying to get the narrative tag, the result should be the starting
    index of "browsing"
  */
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

  /*
    Grab the contents of the string from the argument's starting location, to
    the next argument's starting location. If there is no next argument, grab
    the rest of the string to its end.
  */
  const value = message
    .slice(
      argValueStartIndex,
      nextArgNameStartIndex >= 0 ? nextArgNameStartIndex : undefined
    )
    .trim();

  /*
    There are three cases for parsing lists. Either the message includes the
    "and" or ", " to split values...

    "Hanging out with friends tags John Durd, Bob Chungus"
    "Hanging out with friends tags John Durd and Bob Chungus"
      == ["John Durd", "Bob Chungus"]

    Or we assume the separators are a spaces " "...

    "Getting ready for the day and eating breakfast tags chore breakfast"
      == ["chore", "breakfast"]
  */
  if (GraphQL.isListType(arg.type)) {
    return `[${value
      .split([", ", "and "].find(separator => value.includes(separator)) || " ")
      .map(item => JSON.stringify(item.trim()))
      .filter(item => item !== "")
      .join(", ")}]`;
  }

  return JSON.stringify(value);
};

/*
  Convert GraphQL names like...
  `setTime`, `startTags`, and `thisIsLongerThanThose`

  ...into what a human would provide...
  "start time", "start tags", "this is longer than those"
*/
const nameToWords = (name: string): string =>
  name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
