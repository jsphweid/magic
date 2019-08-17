import { Either, Error, Fn, pipe } from "@grapheng/prelude";
import * as GraphQL from "graphql";
import _ from "lodash";
import Moment from "moment-timezone";

import * as Time from ".";
import * as Utility from "../../Utility";
import * as English from "./English";

export const resolvers = {
  Time__Date: new GraphQL.GraphQLScalarType({
    name: "Time__Date",
    serialize: (value: Time.Date): number => value.valueOf(),
    parseValue: (value: string): Time.Date => parse(value),
    parseLiteral: (valueNode: GraphQL.ValueNode): Time.Date =>
      valueNode.kind === GraphQL.Kind.INT ||
      valueNode.kind === GraphQL.Kind.FLOAT
        ? Moment(parseFloat(valueNode.value))
        : valueNode.kind === GraphQL.Kind.STRING
        ? parse(valueNode.value, valueNode)
        : Utility.throwError(
            new GraphQL.GraphQLError(
              `"${valueNode.kind}" must be an \`Int\`, \`Float\`, or \`String\``
            )
          )
  })
};

export const parse = (
  source: string,
  valueNode?: GraphQL.ValueNode
): Time.Date => {
  const textAfterColon = source
    .toLowerCase()
    .split(":")
    .slice(-1)[0];

  const isMissingMeridiem =
    textAfterColon && !["a", "am", "p", "pm"].includes(textAfterColon);

  const now = Moment();
  const possibleFormats = [Moment.ISO_8601, Moment.RFC_2822, ...formats];
  const timeZone = `${process.env.MAGIC_TIME_ZONE}`;

  for (const format of possibleFormats) {
    const date = Moment.tz(source, format as any, true, timeZone);
    if (!date.isValid()) {
      continue;
    }

    if (date.year() < now.year()) {
      date.year(now.year());
    }

    if (!isMissingMeridiem) {
      return date;
    }

    const closerDate = [
      Moment(date).subtract(12, "hours"),
      Moment(date).add(12, "hours")
    ].find(
      possiblyCloserDate =>
        differenceMS(date, now) > differenceMS(now, possiblyCloserDate)
    );

    return closerDate || date;
  }

  // const thing = English.toDate(source);

  return pipe(
    English.toDate(source),
    Either.fold(
      error => Error.throw(new GraphQL.GraphQLError(error.message, valueNode)),
      Fn.identity
    )
  );
};

const differenceMS = (start: Time.Date, stop: Time.Date): number =>
  Time.duration(Time.stoppedInterval(start, stop))
    .abs()
    .asMilliseconds();

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
