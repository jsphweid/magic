import * as GraphQL from "graphql";

export const fromOperationResult = (
  operation: GraphQL.DocumentNode,
  { data, errors }: GraphQL.ExecutionResult
): string => {
  console.log(data);

  if (!data) {
    return `Something went wrong!${
      errors ? `\n\n${errors.map(({ message }) => message).join("\n")}` : ""
    }`;
  }

  const operationAST = GraphQL.getOperationAST(operation, undefined);
  if (!operationAST || operationAST.selectionSet.selections.length > 1) {
    return operationDataToReply(data);
  }

  const timeSelection = operationAST.selectionSet.selections.find(
    selection =>
      selection.kind === "Field" && ["startTime"].includes(selection.name.value)
  );

  return timeSelection && timeSelection.kind === "Field"
    ? timeQueryDataToReply(data[timeSelection.name.value] as TimeQueryData)
    : operationDataToReply(data);
};

interface TimeQueryData {
  interval: {
    start: { formatted: string };
  };
  narratives: Array<{ description: string }>;
  tagOccurrences: Array<{ tag: { name: string } }>;
}

const timeQueryDataToReply = ({
  interval: {
    start: { formatted }
  },
  narratives,
  tagOccurrences
}: TimeQueryData): string => {
  const [narrative] = narratives;
  const tags = tagOccurrences.map(({ tag: { name } }) =>
    name
      .split("-")
      .map(word => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
      .join(" ")
  );

  if (!narrative && tags.length === 0) {
    return "Nothing is being tracked!";
  }

  return `
    ${formatted} – ${
    narrative ? `${narrative.description}` : "No narrative is active!"
  }

    ${tags.length > 0 ? `Tags: ${tags.join(", ")}` : "No tags are active!"}
  `
    .replace(/    /g, "")
    .trim();
};

const operationDataToReply = (data: any): string => operationDataToReply(data);

const dataToString = (data: any, spaces: string = ""): string => {
  const value =
    !data || typeof data !== "object"
      ? JSON.stringify(data)
      : Object.entries(data)
          .map(
            ([key, value]) => `${key}:\n${dataToString(value, ` ${spaces}`)}`
          )
          .join(`\n${spaces}`);

  return `${spaces}${value}`;
};

console.log(
  dataToString({
    interval: {
      start: {
        formatted: "7:26 PM, Wednesday, September 5th, 2018"
      },
      stop: null
    },
    narratives: [
      {
        interval: {
          start: {
            formatted: "7:26 PM, Wednesday, September 5th, 2018"
          },
          stop: null
        },
        description: "Working on GraphQL over SMS"
      }
    ],
    tagOccurrences: [
      {
        interval: {
          start: {
            formatted: "7:26 PM, Wednesday, September 5th, 2018"
          },
          stop: null
        },
        tag: {
          name: "magic",
          score: "POSITIVE_HIGH",
          connections: [
            {
              name: "code",
              score: "POSITIVE_MEDIUM",
              connections: [
                {
                  name: "productive",
                  score: "POSITIVE_MEDIUM",
                  connections: []
                }
              ]
            },
            {
              name: "productive",
              score: "POSITIVE_MEDIUM",
              connections: []
            }
          ]
        }
      }
    ]
  })
);
