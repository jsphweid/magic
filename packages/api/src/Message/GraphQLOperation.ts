import { option as Option } from "fp-ts";
import * as GraphQL from "graphql";
import gql from "graphql-tag";

const source = gql`
  mutation Track(
    $start: Time__Date = "now"
    $duration: Time__Duration
    $stop: Time__Date
    $include: [String!]
    $exclude: [String!]
    $narrative: String
  ) {
    track(
      time: { start: $start, duration: $duration, stop: $stop }
      tags: { include: { names: $include }, exclude: { names: $exclude } }
      narrative: $narrative
    ) {
      ...history
    }
  }

  query History(
    $start: Time__Date
    $duration: Time__Duration
    $stop: Time__Date
    $include: [String!]
    $exclude: [String!]
  ) {
    history(
      time: { start: $start, duration: $duration, stop: $stop }
      tags: { include: { names: $include }, exclude: { names: $exclude } }
    ) {
      ...history
    }
  }

  fragment history on History {
    narratives {
      time {
        ... on Time__Occurrence {
          start {
            formatted(template: "h:mm A ddd")
          }
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
      description
      tags {
        name
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
  const document = messageToDocument(message);
  const variables = variablesFromDocument(document);

  console.log(variables.map(variable => variable.defaultValue));

  return {
    document,
    variables: messageToVariables(variables, message)
  };
};

// export interface OperationDefinitionNode {
//   readonly kind: "OperationDefinition";
//   readonly loc?: Location;
//   readonly operation: OperationTypeNode;
//   readonly name?: NameNode;
//   readonly variableDefinitions?: ReadonlyArray<VariableDefinitionNode>;
//   readonly directives?: ReadonlyArray<DirectiveNode>;
//   readonly selectionSet: SelectionSetNode;
// }

// export type OperationTypeNode = "query" | "mutation" | "subscription";

// export interface VariableDefinitionNode {
//   readonly kind: "VariableDefinition";
//   readonly loc?: Location;
//   readonly variable: VariableNode;
//   readonly type: TypeNode;
//   readonly defaultValue?: ValueNode;
//   readonly directives?: ReadonlyArray<DirectiveNode>;
// }

// export interface VariableNode {
//   readonly kind: "Variable";
//   readonly loc?: Location;
//   readonly name: NameNode;
// }

const messageToDocument = (message: string): GraphQL.DocumentNode =>
  Option.fromNullable(
    Object.entries(operations).find(
      ([name]) => message.toLowerCase().indexOf(nameToWords(name)) === 0
    )
  )
    .map(([, document]) => document)
    .getOrElse(operations.Track);

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

/*
  For all of the args we have in the root field, return their names and parsed
  values from the message
*/
export const messageToVariables = (
  variables: GraphQL.VariableDefinitionNode[],
  message: string
): Variables =>
  variables.reduce(
    (previous, variable) => ({
      ...previous,
      [variable.variable.name.value]: Option.fromNullable(
        messageToVariableValue(
          variables,
          variable,

          /*
          Since the short-hand `Mutation.track` message looks like...
          - "bathroom"
          - "cutting the grass"
          - "cooking dinner tags cooking, not dinner"

          ...if we don't see the `narrative` argument in the message, we need to
          prepend it...
          - "narrative bathroom"
          - "narrative cutting the grass"
          - "narrative cooking dinner tags cooking, not dinner"

          ...but not if we aren't using the short-hand version, i.e. "track ..."
          is unchanged
        */
          variable.variable.name.value === "narrative" &&
            !message.toLowerCase().includes("narrative") &&
            !message.toLowerCase().includes("track")
            ? `narrative ${message}`
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

/*
  Parse the message into the value of an argument on the root field. If the
  message is "walking the dog start five minutes ago" and we're trying to get
  the value of start, the result should be "five minutes ago".
*/
const messageToVariableValue = (
  variables: GraphQL.VariableDefinitionNode[],
  variable: GraphQL.VariableDefinitionNode,
  message: string
): string | null => {
  /*
    What is the starting location of the argument name? If it wasn't provided
    the argument is "null"
  */
  const argNameAsInputFormat = nameToWords(variable.variable.name.value);
  const argNameStartIndex = message.toLowerCase().indexOf(argNameAsInputFormat);

  if (argNameStartIndex < 0) return null;

  /*
    What is the starting location (index) of the next argument?
    
    If we are trying to get the narrative tag, the result should be the starting
    index of "browsing"
  */
  const argValueStartIndex = argNameStartIndex + argNameAsInputFormat.length;
  const nextArgNameStartIndex = variables
    .map(variableFromOperation =>
      variableFromOperation !== variable
        ? message.indexOf(
            nameToWords(variableFromOperation.variable.name.value)
          )
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
  `track`, `startTags`, and `thisIsLongerThanThose`

  ...into what a human would provide...
  "track", "start tags", "this is longer than those"
*/
const nameToWords = (name: string): string =>
  name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();

fromMessage("track");
