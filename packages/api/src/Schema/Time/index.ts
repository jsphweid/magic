import { option as Option } from "fp-ts";
import gql from "graphql-tag";
import _ from "lodash/fp";
import Moment from "moment-timezone";

import * as Date from "./Scalar/Date";
import * as Duration from "./Scalar/Duration";

export { Batches, fromInterval as batchesFromInterval } from "./Batches";

export {
  Selection,
  GraphQLArgs as SelectionGraphQLArgs,
  fromGraphQLArgs as selectionFromGraphQLArgs
} from "./Selection";

export const schema = gql`
  scalar Time__Date
  scalar Time__Duration
  scalar Time__Milliseconds

  input Time__Selection {
    start: Time__Date
    duration: Time__Duration
    stop: Time__Date
  }

  union Time__Time =
      Time__Instant
    | Time__OngoingInterval
    | Time__StoppedInterval

  interface Time__Timed {
    time: Time__Time!
  }

  interface Time__Occurrence {
    start: Time__FormattedDate!
  }

  type Time__Instant implements Time__Occurrence {
    start: Time__FormattedDate!
  }

  interface Time__Interval {
    duration: Time__FormattedDuration!
  }

  type Time__OngoingInterval implements Time__Occurrence & Time__Interval {
    start: Time__FormattedDate!
    duration: Time__FormattedDuration!
  }

  type Time__StoppedInterval implements Time__Occurrence & Time__Interval {
    start: Time__FormattedDate!
    duration: Time__FormattedDuration!
    stop: Time__FormattedDate!
  }

  type Time__FormattedDate {
    iso: String!
    unix: Time__FormattedDuration!
    humanized: String!
    formatted(template: String = "h:mm A, dddd, MMMM Do, YYYY"): String!
  }

  type Time__FormattedDuration {
    humanized: String!
    milliseconds: Time__Milliseconds!
    seconds: Float!
    minutes: Float!
    hours: Float!
    days: Float!
    weeks: Float!
    months: Float!
    years: Float!
  }
`;

export interface Timed {
  time: Time;
}

export type Time = Instant | Interval;

interface Instant {
  start: Date;
}

export type Interval = OngoingInterval | StoppedInterval;

export interface OngoingInterval extends Instant {
  toStopped: (stop?: Date | null) => StoppedInterval;
}

export interface StoppedInterval extends OngoingInterval {
  stop: Date;
  duration(): Duration;
}

export type Date = Moment.Moment;
export type Duration = Moment.Duration;

export const instant = (start: Date): Instant => ({ start });

export const ongoingInterval = (start: Date): OngoingInterval => ({
  ...instant(start),
  toStopped: stop =>
    stoppedInterval(start, Option.fromNullable(stop).getOrElseL(Moment))
});

export const stoppedInterval = (start: Date, stop: Date): StoppedInterval => {
  const stopOrNow = Option.fromNullable(stop).getOrElseL(Moment);
  return {
    ...ongoingInterval(start),
    stop: stopOrNow,
    duration: () => Moment.duration(stopOrNow.diff(start))
  };
};

export const resolvers = {
  Time__Date: Date.resolve,
  Time__Duration: Duration.resolve,

  Time__Timed: { __resolveType: () => "Time__Timed" },
  Time__Time: {
    __resolveType: (time: Time): string =>
      (time as StoppedInterval).stop
        ? "Time__StoppedInterval"
        : (time as OngoingInterval).toStopped
        ? "Time__OngoingInterval"
        : "Time__Instant"
  },

  Time__Occurrence: { __resolveType: () => "Time__Occurrence" },
  Time__Interval: { __resolveType: () => "Time__Interval" },

  Time__OngoingInterval: {
    duration: (interval: OngoingInterval) => interval.toStopped().duration()
  },

  Time__StoppedInterval: {
    duration: (interval: StoppedInterval) => interval.duration()
  },

  Time__FormattedDate: {
    iso: (date: Date): string => date.toISOString(),
    unix: (date: Date): Duration => Moment.duration(date.unix(), "seconds"),
    humanized: (date: Date): string =>
      stoppedInterval(Moment(), date)
        .duration()
        .humanize(true),
    formatted: (date: Date, args: { template: string }): string =>
      date.tz(`${process.env.MAGIC_TIME_ZONE}`).format(args.template)
  },

  Time__FormattedDuration: {
    humanized: (duration: Duration): string => duration.humanize(),
    milliseconds: (duration: Duration): number => duration.asMilliseconds(),
    seconds: (duration: Duration): number => duration.asSeconds(),
    minutes: (duration: Duration): number => duration.asMinutes(),
    hours: (duration: Duration): number => duration.asHours(),
    days: (duration: Duration): number => duration.asDays(),
    weeks: (duration: Duration): number => duration.asWeeks(),
    months: (duration: Duration): number => duration.asMonths(),
    years: (duration: Duration): number => duration.asYears()
  }
};
