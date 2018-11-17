import { option as Option } from "fp-ts";
import Moment from "moment";

import * as Result from "../../Result";
import * as Time from "./index";

export interface Selection {
  start: Option.Option<Time.Date>;
  stop: Option.Option<Time.Date>;
}

export interface GraphQLArgs {
  start: Time.Date | null;
  duration: Time.Duration | null;
  stop: Time.Date | null;
}

export const fromGraphQLArgs = (
  args: GraphQLArgs
): Result.Result<Selection> => {
  const start = Option.fromNullable(args.start);
  const duration = Option.fromNullable(args.duration);
  const stop = Option.fromNullable(args.stop);

  // If we have a `start` and `stop`, ignore the duration
  if (start.isSome() && stop.isSome()) return fromDates(start, stop);

  // If only `stop` is missing, it becomes `start` plus the `duration`
  if (start.isSome() && duration.isSome()) {
    return fromDates(
      start,
      Option.some(Moment(start.value).add(duration.value))
    );
  }

  // If only `start` is missing, it becomes `stop` minus the `duration`
  if (stop.isSome() && duration.isSome()) {
    return fromDates(
      Option.some(Moment(stop.value).subtract(duration.value)),
      stop
    );
  }

  // If `start` is missing, it becomes _now_ minus the `duration`
  if (start.isNone() && duration.isSome()) {
    return fromDates(Option.some(Moment().subtract(duration.value)), stop);
  }

  return fromDates(start, stop);
};

// `start` should never be after `stop`
const fromDates = (
  start: Option.Option<Time.Date>,
  stop: Option.Option<Time.Date>
): Result.Result<Selection> =>
  start.isSome() &&
  stop.isSome() &&
  start.value.valueOf() > stop.value.valueOf()
    ? Result.error("`start` has to come before `stop`")
    : Result.success({ start, stop });
