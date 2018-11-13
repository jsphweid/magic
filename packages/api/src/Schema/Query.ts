import { option as Option } from "fp-ts";
import gql from "graphql-tag";
import _ from "lodash/fp";
import Moment from "moment";

import * as Context from "./Context";
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
    },
    context: Context.Context
  ): Promise<History.History> => {
    const start = Option.fromNullable(args.start);
    const duration = Option.fromNullable(args.duration);
    const stop = Option.fromNullable(args.stop);

    const getHistory = _.curry(History.getFromDates)(context);

    // If we have a `start` and `stop`, ignore the duration
    if (start.isSome() && stop.isSome()) return getHistory(start, stop);

    // If only `stop` is missing, it becomes `start` plus the `duration`
    if (start.isSome() && duration.isSome()) {
      return getHistory(
        start,
        Option.some(Moment(start.value).add(duration.value))
      );
    }

    // If only `start` is missing, it becomes `stop` minus the `duration`
    if (stop.isSome() && duration.isSome()) {
      return getHistory(
        Option.some(Moment(stop.value).subtract(duration.value)),
        stop
      );
    }

    // If `start` is missing, it becomes now minus the `duration`
    if (start.isNone() && duration.isSome()) {
      return getHistory(Option.some(Moment().subtract(duration.value)), stop);
    }

    return getHistory(start, stop);
  }
};
