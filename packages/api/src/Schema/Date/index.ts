import * as GraphQL from "graphql";
import gql from "graphql-tag";
import Moment from "moment";

import { Interval } from "~/time";

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
  /*
    Try all the hard-coded `Moment` formats at the end of this file
    https://momentjs.com/docs/#/parsing/string-format/
  */
  for (const format of allowedInputFormats) {
    const now = Moment();
    const moment = Moment(source, format, true)
      .utcOffset(`${process.env.TIME_UTC_OFFSET}`)
      .year(now.year());

    if (moment.isValid()) {
      // Make sure 10:00 PM recorded at 12:45 AM isn't referring to the future
      return Interval.duration({ start: moment, stop: now }).asHours() <= -12
        ? moment.subtract(1, "day")
        : moment;
    }
  }

  // Try parsing the date from english-like values i.e. "in five minutes"
  const { value: date } = English.toDate(source);
  if (date instanceof Error) {
    throw new GraphQL.GraphQLError(date.message, ast);
  }

  return date;
};

const allowedInputFormats = [
  Moment.ISO_8601,
  Moment.RFC_2822,

  "MM-DD-YYYY h:mm A",
  "MM-DD-YYYY h:mm a",
  "MM-DD-YYYY",
  "MM-DD-YY h:mm A",
  "MM-DD-YY h:mm a",
  "MM-DD-YY",

  "MMMM D, YYYY h:mm A",
  "MMMM D, YYYY h:mm a",
  "MMMM D, YYYY",
  "MMMM D, YY h:mm A",
  "MMMM D, YY h:mm a",
  "MMMM D, YY",
  "MMMM D, h:mm A",
  "MMMM D, h:mm a",
  "MMMM D YYYY h:mm A",
  "MMMM D YYYY h:mm a",
  "MMMM D YYYY",
  "MMMM D YY h:mm A",
  "MMMM D YY h:mm a",
  "MMMM D YY",
  "MMMM D h:mm A",
  "MMMM D h:mm a",
  "MMMM D",

  "MMM D, YYYY h:mm A",
  "MMM D, YYYY h:mm a",
  "MMM D, YYYY",
  "MMM D, YY h:mm A",
  "MMM D, YY h:mm a",
  "MMM D, YY",
  "MMM D, h:mm A",
  "MMM D, h:mm a",
  "MMM D YYYY h:mm A",
  "MMM D YYYY h:mm a",
  "MMM D YYYY",
  "MMM D YY h:mm A",
  "MMM D YY h:mm a",
  "MMM D YY",
  "MMM D h:mm A",
  "MMM D h:mm a",
  "MMM D",

  "MMMM Do, YYYY h:mm A",
  "MMMM Do, YYYY h:mm a",
  "MMMM Do, YYYY",
  "MMMM Do, YY h:mm A",
  "MMMM Do, YY h:mm a",
  "MMMM Do, YY",
  "MMMM Do, h:mm A",
  "MMMM Do, h:mm a",
  "MMMM Do YYYY h:mm A",
  "MMMM Do YYYY h:mm a",
  "MMMM Do YYYY",
  "MMMM Do YY h:mm A",
  "MMMM Do YY h:mm a",
  "MMMM Do YY",
  "MMMM Do h:mm A",
  "MMMM Do h:mm a",
  "MMMM Do",

  "MMM Do, YYYY h:mm A",
  "MMM Do, YYYY h:mm a",
  "MMM Do, YYYY",
  "MMM Do, YY h:mm A",
  "MMM Do, YY h:mm a",
  "MMM Do, YY",
  "MMM Do, h:mm A",
  "MMM Do, h:mm a",
  "MMM Do YYYY h:mm A",
  "MMM Do YYYY h:mm a",
  "MMM Do YYYY",
  "MMM Do YY h:mm A",
  "MMM Do YY h:mm a",
  "MMM Do YY",
  "MMM Do h:mm A",
  "MMM Do h:mm a",
  "MMM Do",

  "h:mm A",
  "h:mm a"
];
