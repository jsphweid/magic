import { option as Option } from "fp-ts";
import * as GraphQL from "graphql";
import gql from "graphql-tag";

const source = gql`
  mutation default(
    $description: String
    $start: Time__Date
    $duration: Time__Duration
    $stop: Time__Date
    $include: [String!]
    $exclude: [String!]
  ) {
    Narrative {
      new(
        description: $description
        time: { start: $start, duration: $duration, stop: $stop }
        tags: { include: { names: $include }, exclude: { names: $exclude } }
      ) {
        ...narrative
      }
    }
  }

  query history(
    $start: Time__Date
    $duration: Time__Duration
    $stop: Time__Date
    $include: [String!]
    $exclude: [String!]
  ) {
    History {
      all(
        time: { start: $start, duration: $duration, stop: $stop }
        tags: { include: { names: $include }, exclude: { names: $exclude } }
      ) {
        narratives {
          ...narrative
        }
      }
    }
  }

  fragment narrative on Narrative__Narrative {
    description
    tags {
      name
    }
    time {
      start {
        formatted(template: "h:mm A ddd")
      }
      ... on Time__Interval {
        duration {
          humanized
        }
      }
      ... on Time__StoppedInterval {
        stop {
          formatted(template: "h:mm A ddd")
        }
      }
    }
  }
`;

const operations: {
  [name: string]: GraphQL.DocumentNode;
} = GraphQL.separateOperations(source);

interface Variables {
  [name: string]: string | null;
}

/*
  Transfrom an SMS message into GraphQL operation source code to run against
  the schema
*/
export const fromMessage = (
  message: string
): { document: GraphQL.DocumentNode; variables: Variables } => {
  const document = documentFromMessage(message);
  const variables = variablesFromDocument(document);
  return {
    document,
    variables: variablesFromMessage(variables, message)
  };
};

const documentFromMessage = (message: string): GraphQL.DocumentNode =>
  Option.fromNullable(
    Object.entries(operations).find(
      ([name]) => message.toLowerCase().indexOf(wordsFromName(name)) === 0
    )
  )
    .map(([, document]) => document)
    .getOrElse(operations.default);

const variablesFromDocument = (
  document: GraphQL.DocumentNode
): GraphQL.VariableDefinitionNode[] => {
  const [operation] = Option.fromNullable(document.definitions.filter(
    ({ kind }) => kind === "OperationDefinition"
  ) as GraphQL.OperationDefinitionNode[]).getOrElse([]);

  return Option.fromNullable(
    operation.variableDefinitions as GraphQL.VariableDefinitionNode[]
  ).getOrElse([]);
};

export const variablesFromMessage = (
  variables: GraphQL.VariableDefinitionNode[],
  message: string
): Variables =>
  variables.reduce(
    (previous, variable) => ({
      ...previous,
      [variable.variable.name.value]: Option.fromNullable(
        variableValueFromMessage(
          variables,
          variable,

          /*
            Since the short-hand `default` message looks like...
            - "bathroom"
            - "cutting the grass"
            - "cooking dinner tags cooking, not dinner"

            ...if we don't see the `description` argument in the message, we
            need to prepend it...
            - "description bathroom"
            - "description cutting the grass"
            - "description cooking dinner tags cooking, not dinner"

            ...but not if we aren't using the short-hand version, i.e.
            "default ..." is unchanged
          */
          variable.variable.name.value === "description" &&
            !message.toLowerCase().includes("description") &&
            !message.toLowerCase().includes("default")
            ? `description ${message}`
            : message
        )
      ).getOrElse(
        Option.fromNullable(variable.defaultValue)
          .map(GraphQL.valueFromASTUntyped)
          .getOrElse(null)
      )
    }),
    {}
  );

const variableValueFromMessage = (
  variables: GraphQL.VariableDefinitionNode[],
  variable: GraphQL.VariableDefinitionNode,
  message: string
): string | null => {
  const variableNameAsWords = wordsFromName(variable.variable.name.value);
  const variableNameStartIndex = message
    .toLowerCase()
    .indexOf(variableNameAsWords);

  if (variableNameStartIndex < 0) return null;

  const valueStartIndex = variableNameStartIndex + variableNameAsWords.length;
  const nextVariableStartIndex = variables
    .map(variableFromOperation =>
      variableFromOperation !== variable
        ? message.indexOf(
            wordsFromName(variableFromOperation.variable.name.value)
          )
        : -1
    )
    .filter(index => index >= valueStartIndex)
    .sort((a, b) => (a > b ? 1 : -1))[0];

  /*
    Grab the contents of the string from the argument's starting location, to
    the next argument's starting location. If there is no next argument, grab
    the rest of the string to its end.
  */
  const value = message
    .slice(
      valueStartIndex,
      nextVariableStartIndex >= 0 ? nextVariableStartIndex : undefined
    )
    .trim();

  /*
    There are three cases for parsing lists. Either the message includes the
    "and" or ", " to split values...

    "Hanging out with friends tags John Durd, Bob Chungus"
    "Hanging out with friends tags John Durd and Bob Chungus"
      == ["John Durd", "Bob Chungus"]

    Or we assume the separators are spaces...

    "Getting ready for the day and eating breakfast tags chore breakfast"
      == ["chore", "breakfast"]
  */
  return !GraphQL.isListType(variable.type)
    ? value
    : `[${value
        .split(
          Option.fromNullable(
            [", ", "and "].find(separator => value.includes(separator))
          ).getOrElse(" ")
        )
        .map(item => JSON.stringify(item.trim()))
        .filter(item => item !== "")
        .join(", ")}]`;
};

/*
  Convert GraphQL names like...
  `default`, `startTags`, and `thisIsLongerThanThose`

  ...into what a human would provide...
  "default", "start tags", "this is longer than those"
*/
const wordsFromName = (name: string): string =>
  name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
