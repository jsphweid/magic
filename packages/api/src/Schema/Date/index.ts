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

  parseValue: (value: string): Moment.Moment | null => parseDate(value),
  parseLiteral: (ast: GraphQL.ValueNode): Moment.Moment | null => {
    if (ast.kind === GraphQL.Kind.INT || ast.kind === GraphQL.Kind.FLOAT) {
      return Moment(parseFloat(ast.value));
    }

    if (ast.kind === GraphQL.Kind.STRING) {
      return parseDate(ast.value) || null;
    }

    return null;
  }
});

const parseDate = (date: string): Moment.Moment | null => {
  if (
    Moment(date, Moment.ISO_8601).isValid() ||
    Moment(date, Moment.RFC_2822).isValid()
  ) {
    return Moment(date);
  }

  return English.toDate(date) || null;
};
