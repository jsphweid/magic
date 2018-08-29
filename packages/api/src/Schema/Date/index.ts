import * as GraphQL from "graphql";
import gql from "graphql-tag";
import Moment from "moment";

// import * as English from "./English";

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

    if (ast.kind === GraphQL.Kind.STRING) {
      return parseDate(ast.value);
    }

    throw new GraphQL.GraphQLError(
      `"${ast.kind}" isn't an \`Int\`, \`Float\`, or \`String\``,
      ast
    );
  }
});

const parseDate = (date: string, ast?: GraphQL.ValueNode): Moment.Moment => {
  if (
    Moment(date, Moment.ISO_8601).isValid() ||
    Moment(date, Moment.RFC_2822).isValid()
  ) {
    return Moment(date);
  }

  throw new GraphQL.GraphQLError(
    `"${date}" cannot be parsed into a \`Date\``,
    ast
  );
};
