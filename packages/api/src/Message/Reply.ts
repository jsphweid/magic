import * as GraphQL from "graphql";

export const fromOperationResult = (
  operation: GraphQL.DocumentNode,
  { data, errors }: GraphQL.ExecutionResult
): string => {
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
      selection.kind === "Field" &&
      ["time", "startTime"].includes(selection.name.value)
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

const operationDataToReply = (data: any): string => toJSON(data);
const toJSON = (data: any): string => JSON.stringify(data, undefined, 1);
