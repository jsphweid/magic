import { option as Option } from "fp-ts";
import gql from "graphql-tag";
import Moment from "moment";

import * as History from "./History";
import * as Time from "./Time";

export const schema = gql`
  type Query {
    history(start: Date, duration: Duration, stop: Date): History!
  }
`;

export const resolve = {
  history: async (
    _source: undefined,
    args: {
      start: Time.Date | null;
      duration: Time.Duration | null;
      stop: Time.Date | null;
    }
  ): Promise<History.History> => {
    const start = Option.fromNullable(args.start);
    const duration = Option.fromNullable(args.duration);
    const stop = Option.fromNullable(args.stop);

    console.log({ start, duration, stop });

    // If we have a `start` and `stop`, ignore the duration
    if (start.isSome() && stop.isSome()) {
      return History.fromDates(start, stop);
    }

    // If only `stop` is missing, it becomes `start` plus the `duration`
    if (start.isSome() && duration.isSome()) {
      return History.fromDates(
        start,
        Option.some(
          Moment(start.value).add(duration.value.asMilliseconds(), "ms")
        )
      );
    }

    // If only `start` is missing, it becomes `stop` minus the `duration`
    if (stop.isSome() && duration.isSome()) {
      return History.fromDates(
        Option.some(
          Moment(stop.value).subtract(duration.value.asMilliseconds(), "ms")
        ),
        stop
      );
    }

    // If `start` is missing, it becomes now minus the `duration`
    if (start.isNone() && duration.isSome()) {
      return History.fromDates(
        Option.some(Moment().subtract(duration.value)),
        stop
      );
    }

    return History.fromDates(start, stop);
  }
};
