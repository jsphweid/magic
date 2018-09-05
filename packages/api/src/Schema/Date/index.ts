import * as GraphQL from "graphql";
import gql from "graphql-tag";
import Moment from "moment";

import * as English from "./English";

export const schema = gql`
  scalar Date
`;

export const resolve = new GraphQL.GraphQLScalarType({
  name: "Date",
  serialize: (value: Moment.Moment): number => value.valueOf(),
  parseValue: (value: string): Moment.Moment => parseDate(value),
  parseLiteral: (ast: GraphQL.ValueNode): Moment.Moment => {
    if (ast.kind === GraphQL.Kind.INT || ast.kind === GraphQL.Kind.FLOAT) {
      return Moment(parseFloat(ast.value));
    }

    if (ast.kind !== GraphQL.Kind.STRING) {
      throw new GraphQL.GraphQLError(
        `"${ast.kind}" must be an \`Int\`, \`Float\`, or \`String\``
      );
    }

    return parseDate(ast.value, ast);
  }
});

const parseDate = (source: string, ast?: GraphQL.ValueNode): Moment.Moment => {
  if (
    Moment(source, Moment.ISO_8601).isValid() ||
    Moment(source, Moment.RFC_2822).isValid()
  ) {
    return Moment(source);
  }

  const { value: date } = English.toDate(source);
  if (date instanceof Error) {
    throw new GraphQL.GraphQLError(date.message, ast);
  }

  return date;
};
