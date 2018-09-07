import * as GraphQL from "graphql";

import * as Time from "./Time";
import * as Data from "./Data";

export const fromResult = (
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
    return Data.toString(data);
  }

  const timeSelection = operationAST.selectionSet.selections.find(
    selection =>
      selection.kind === "Field" && ["startTime"].includes(selection.name.value)
  );

  return timeSelection && timeSelection.kind === "Field"
    ? Time.toString(data[timeSelection.name.value])
    : Data.toString(data);
};
