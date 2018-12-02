import { either as Either } from "fp-ts";
import * as GraphQL from "graphql";
import * as Runtime from "io-ts";
import Moment from "moment";

import * as Utility from "../../../Utility";
import * as English from "./English";
import { unsafeDecode, unsafeDecodeLiteral } from "./index";

export type Duration = Moment.Duration;

export const duration = new Runtime.Type<Duration, number>(
  "Duration",
  (data): data is Duration => Moment.isDuration(data),
  (data, context) =>
    Runtime.union([Runtime.string, Runtime.number])
      .validate(data, context)
      .map<Either.Either<string, number>>(stringOrNumber => {
        const asString = `${stringOrNumber}`;
        const asNumber = parseFloat(asString);
        return isNaN(asNumber) ? Either.left(asString) : Either.right(asNumber);
      })
      .chain(stringOrNumber =>
        stringOrNumber.fold(
          string => Runtime.success(parse(string)),
          number => Runtime.success(Moment.duration(number, "ms"))
        )
      ),
  duration => duration.asMilliseconds()
);

export const resolve = new GraphQL.GraphQLScalarType({
  name: "Time__Duration",
  serialize: duration.encode,
  parseValue: unsafeDecode(duration),
  parseLiteral: unsafeDecodeLiteral(duration)
});

// Try parsing the duration from english-like values i.e. "five minutes"
const parse = (source: string, valueNode?: GraphQL.ValueNode): Duration =>
  English.toDuration(source).getOrElseL(error =>
    Utility.throwError(new GraphQL.GraphQLError(error.message, valueNode))
  );
