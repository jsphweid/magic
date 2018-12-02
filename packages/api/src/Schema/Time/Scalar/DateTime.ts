import { option as Option } from "fp-ts";
import * as GraphQL from "graphql";
import * as Runtime from "io-ts";
import _ from "lodash";
import Moment from "moment-timezone";

import * as Result from "../../../Result";
import * as Time from "../index";
import * as English from "./English";
import {
  runtimeStringOrNumber,
  unsafeDecode,
  unsafeDecodeLiteral
} from "./index";

export type DateTime = Moment.Moment;

export const dateTime = new Runtime.Type<DateTime, number>(
  "DateTime",
  (data): data is DateTime => Moment.isMoment(data),
  (data, context) =>
    runtimeStringOrNumber(data, context).chain(stringOrNumber =>
      stringOrNumber.fold(
        string =>
          parse(string).fold(
            _ => Runtime.failure(string, context),
            dateTime => Runtime.success(dateTime)
          ),
        number => {
          const asMoment = Moment(number);
          return asMoment.isValid()
            ? Runtime.success(asMoment)
            : Runtime.failure(asMoment, context);
        }
      )
    ),
  dateTime => dateTime.valueOf()
);

export const resolve = new GraphQL.GraphQLScalarType({
  name: "Time__DateTime",
  serialize: dateTime.encode,
  parseValue: unsafeDecode(dateTime),
  parseLiteral: unsafeDecodeLiteral(dateTime)
});

const parse = (source: string): Result.Result<DateTime> => {
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
    const asDateTime = Moment.tz(
      source,
      format,
      true,
      `${process.env.MAGIC_TIME_ZONE}`
    );

    if (!asDateTime.isValid()) {
      continue;
    }

    // Parsing without a year can yield times way in the past
    if (asDateTime.year() < 2018) {
      asDateTime.year(2018);
    }

    if (isSourceMissingMeridiem) {
      return Result.success(asDateTime);
    }

    /*
    Sometimes the date Moment parses can be off when "AM" or "PM" is missing.
    12:30 might become 12:30 AM even though 12:30 PM is closer. We need to
    check for that situation and adjust the date if it occurs.
  */

    const closerDate = [
      Moment(asDateTime).subtract(12, "hours"),
      Moment(asDateTime).add(12, "hours")
    ].find(
      alteredDate =>
        differenceMS(asDateTime, now) > differenceMS(now, alteredDate)
    );

    return Result.success(
      Option.fromNullable(closerDate).getOrElse(asDateTime)
    );
  }

  // Try parsing the date from english-like values i.e. "in five minutes"
  return English.toDate(source);
};

const differenceMS = (start: DateTime, stop: DateTime): number =>
  Math.abs(
    Time.stoppedInterval(start, stop)
      .duration()
      .asMilliseconds()
  );

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
