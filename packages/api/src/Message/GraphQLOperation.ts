import { option as Option } from "fp-ts";
import * as GraphQL from "graphql";
import gql from "graphql-tag";

const source = gql`
  mutation NewTag(
    $name: String!
    $aliases: [String!]
    $score: Int
    $connections: [String!]
  ) {
    Tag {
      new(
        name: $name
        aliases: $aliases
        score: $score
        connections: { names: $connections }
      ) {
        name
        aliases
        score
        connections {
          name
        }
      }
    }
  }

  # mutation UpdateTags(
  #   $start: Time__DateTime
  #   $duration: Time__Duration
  #   $stop: Time__DateTime
  #   $origin: Narrative__Origin
  #   $add: [String!]
  #   $remove: [String!]
  # ) {
  #   Narrative {
  #     updateTags(
  #       origin: $origin
  #       time: { start: $start, duration: $duration, stop: $stop }
  #       tags: { names: $tags }
  #       description: $description
  #     ) {
  #       ...narrative
  #     }
  #   }
  # }

  mutation Track(
    $start: Time__DateTime
    $duration: Time__Duration
    $stop: Time__DateTime
    $include: [String!]
    $exclude: [String!]
    $description: String
  ) {
    Narrative {
      new(
        time: { start: $start, duration: $duration, stop: $stop }
        tags: { include: { names: $include }, exclude: { names: $exclude } }
        description: $description
      ) {
        ...narrative
      }
    }
  }

  query History(
    $start: Time__DateTime
    $duration: Time__Duration
    $stop: Time__DateTime
    $include: [String!]
    $exclude: [String!]
  ) {
    History {
      history(
        time: { start: $start, duration: $duration, stop: $stop }
        tags: { include: { names: $include }, exclude: { names: $exclude } }
      ) {
        narratives {
          ...narrative
        }
      }
    }
  }

  fragment narrative on Narrative {
    description
    tags {
      name
    }
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
            Since the short-hand `Track` message looks like...
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
          variable.variable.name.value === "description" &&
            !message.toLowerCase().includes("description") &&
            !message.toLowerCase().includes("track")
            ? `description ${message}`
            : message
        ).toNullable()
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
): Option.Option<string> => {
  const variableNameAsWords = wordsFromName(variable.variable.name.value);
  const variableNameStartIndex = message
    .toLowerCase()
    .indexOf(variableNameAsWords);

  if (variableNameStartIndex < 0) return Option.none;

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

    Or we assume the separators are a spaces " "...

    "Getting ready for the day and eating breakfast tags chore breakfast"
      == ["chore", "breakfast"]
  */
  return Option.some(
    !GraphQL.isListType(variable.type)
      ? value
      : `[${value
          .split(
            Option.fromNullable(
              [", ", "and "].find(separator => value.includes(separator))
            ).getOrElse(" ")
          )
          .map(item => JSON.stringify(item.trim()))
          .filter(item => item !== "")
          .join(", ")}]`
  );
};

/*
  Convert GraphQL names like...
  `track`, `startTags`, and `thisIsLongerThanThose`

  ...into what a human would provide...
  "track", "start tags", "this is longer than those"
*/
const wordsFromName = (name: string): string =>
  name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
