import { option as Option } from "fp-ts";
import * as GraphQL from "graphql";
import _ from "lodash";
import Moment from "moment-timezone";

import * as Utility from "../../../Utility";
import * as Time from "../index";
import * as English from "./English";

export const resolve = new GraphQL.GraphQLScalarType({
  name: "Date",
  serialize: (value: Time.Date): number => value.valueOf(),
  parseValue: (value: string): Time.Date => parse(value),
  parseLiteral: (valueNode: GraphQL.ValueNode): Time.Date =>
    valueNode.kind === GraphQL.Kind.INT || valueNode.kind === GraphQL.Kind.FLOAT
      ? Moment(parseFloat(valueNode.value))
      : valueNode.kind === GraphQL.Kind.STRING
      ? parse(valueNode.value, valueNode)
      : Utility.throwError(
          new GraphQL.GraphQLError(
            `"${valueNode.kind}" must be an \`Int\`, \`Float\`, or \`String\``
          )
        )
});

const parse = (source: string, valueNode?: GraphQL.ValueNode): Time.Date => {
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

    const closerDate = [
      Moment(date).subtract(12, "hours"),
      Moment(date).add(12, "hours")
    ].find(
      alteredDate => differenceMS(date, now) > differenceMS(now, alteredDate)
    );

    return Option.fromNullable(closerDate).getOrElse(date);
  }

  // Try parsing the date from english-like values i.e. "in five minutes"
  return English.toDate(source).getOrElseL(error =>
    Utility.throwError(new GraphQL.GraphQLError(error.message, valueNode))
  );
};

const differenceMS = (start: Time.Date, stop: Time.Date): number =>
  Math.abs(Time.durationFromDates(start, stop).asMilliseconds());

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
