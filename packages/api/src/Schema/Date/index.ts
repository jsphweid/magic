import { option as Option } from "fp-ts";
import * as GraphQL from "graphql";
import gql from "graphql-tag";
import _ from "lodash";
import Moment from "moment-timezone";

import * as Utility from "../../Utility";
import * as Duration from "../Duration";
import * as English from "./English";

export const schema = gql`
  scalar Date
`;

export const resolve = new GraphQL.GraphQLScalarType({
  name: "Date",
  serialize: (value: Moment.Moment): number => value.valueOf(),
  parseValue: (value: string): Moment.Moment => parseDate(value),
  parseLiteral: (ast: GraphQL.ValueNode): Moment.Moment =>
    ast.kind === GraphQL.Kind.INT || ast.kind === GraphQL.Kind.FLOAT
      ? Moment(parseFloat(ast.value))
      : ast.kind === GraphQL.Kind.STRING
        ? parseDate(ast.value, ast)
        : Utility.throwError(
            new GraphQL.GraphQLError(
              `"${ast.kind}" must be an \`Int\`, \`Float\`, or \`String\``
            )
          )
});

const parseDate = (source: string, ast?: GraphQL.ValueNode): Moment.Moment => {
  /*
    Check if the source has the meridiem marker (A/AM/P/PM). If it doesn't we'll
    use that information later to make a better guess about what time was meant.
  */
  const [, lastTimePart] = source.split(":");
  const isSourceMissingMeridiem =
    lastTimePart &&
    !["A", "AM", "P", "PM"].includes(lastTimePart.toUpperCase());

  const now = Moment();

  /*
    Try a bunch of hard-coded `Moment` formats (at the end of this file)
    https://momentjs.com/docs/#/parsing/string-format/
  */
  for (const format of [Moment.ISO_8601, Moment.RFC_2822, ...formats]) {
    const date = Moment.tz(
      source,
      format,
      true,
      `${process.env.MAGIC_TIME_ZONE}`
    );

    if (!date.isValid()) {
      continue;
    }

    // Parsing without a year can yield times way in the past
    if (date.year() < 2018) {
      date.year(2018);
    }

    if (isSourceMissingMeridiem) {
      return date;
    }

    /*
      Sometimes the date Moment parses can be off when "AM" or "PM" is missing.
      12:30 might become 12:30 AM even though 12:30 PM is closer. We need to
      check for that situation and adjust the date if it occurs.
    */

    const timeDifferenceFromNowMS = timeDifferenceMS(date, now);
    const closerDate = [
      Moment(date).subtract(12, "hours"),
      Moment(date).add(12, "hours")
    ].find(
      alteredDate =>
        timeDifferenceFromNowMS > timeDifferenceMS(now, alteredDate)
    );

    return Option.fromNullable(closerDate).getOrElse(date);
  }

  // Try parsing the date from english-like values i.e. "in five minutes"
  const { value: date } = English.toDate(source).mapLeft(error =>
    Utility.throwError(new GraphQL.GraphQLError(error.message, ast))
  );

  return date;
};

const timeDifferenceMS = (start: Moment.Moment, stop: Moment.Moment): number =>
  Math.abs(Duration.fromDates(start, stop).asMilliseconds());

const dateFormats = [
  "MM-DD-YYYY",
  "MM-DD-YY",

  "MMMM D, YYYY",
  "MMMM D, YY",

  "MMMM D YYYY",
  "MMMM D YY",

  "MMMM D",

  "MMM D, YYYY",
  "MMM D, YY",

  "MMM D YYYY",
  "MMM D YY",

  "MMM D",

  "MMMM Do, YYYY",
  "MMMM D, YY",

  "MMMM Do YYYY",
  "MMMM Do YY",

  "MMMM Do",

  "MMM Do, YYYY",
  "MMM Do, YY",

  "MMM Do YYYY",
  "MMM Do YY",

  "MMM Do"
];

const timeFormats = [
  "h:mm:ss a",
  "h:mm:ssa",
  "h:mm:ss",
  "h:mm a",
  "h:mma",
  "h:mm",
  "hmmssa",
  "hmma",
  "hmmss",
  "hmm"
];

const formats = _.flattenDeep([
  ...dateFormats.map(dateFormat =>
    timeFormats.map(timeFormat => `${dateFormat} ${timeFormat}`)
  ),
  ...timeFormats
]);
