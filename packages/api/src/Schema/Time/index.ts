import { option as Option } from "fp-ts";
import gql from "graphql-tag";
import _ from "lodash/fp";
import Moment from "moment-timezone";

import * as DateTime from "./Scalar/DateTime";
import * as Duration from "./Scalar/Duration";

export { DateTime, dateTime } from "./Scalar/DateTime";
export { Duration, duration } from "./Scalar/Duration";

export { Batches, fromInterval as batchesFromInterval } from "./Batches";

export {
  Selection,
  GraphQLArgs as SelectionGraphQLArgs,
  fromGraphQLArgs as selectionFromGraphQLArgs
} from "./Selection";

export const schema = gql`
  scalar Time__DateTime
  scalar Time__Duration
  scalar Time__Milliseconds

  input Time__Selection {
    start: Time__DateTime
    duration: Time__Duration
    stop: Time__DateTime
  }

  union Time = Time__Instant | Time__OngoingInterval | Time__StoppedInterval

  interface Time__Timed {
    time: Time!
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
  start: DateTime.DateTime;
}

export type Interval = OngoingInterval | StoppedInterval;

export interface OngoingInterval extends Instant {
  toStopped: (stop?: DateTime.DateTime | null) => StoppedInterval;
}

export interface StoppedInterval extends OngoingInterval {
  stop: DateTime.DateTime;
  duration(): Duration.Duration;
}

export const instant = (start: DateTime.DateTime): Instant => ({ start });

export const ongoingInterval = (start: DateTime.DateTime): OngoingInterval => ({
  ...instant(start),
  toStopped: stop =>
    stoppedInterval(start, Option.fromNullable(stop).getOrElseL(Moment))
});

export const stoppedInterval = (
  start: DateTime.DateTime,
  stop: DateTime.DateTime
): StoppedInterval => {
  const stopOrNow = Option.fromNullable(stop).getOrElseL(Moment);
  return {
    ...ongoingInterval(start),
    stop: stopOrNow,
    duration: () => Moment.duration(stopOrNow.diff(start))
  };
};

export const resolvers = {
  Time__DateTime: DateTime.resolve,
  Time__Duration: Duration.resolve,

  Time__Timed: { __resolveType: () => "Time__Timed" },
  Time: {
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
    iso: (dateTime: DateTime.DateTime): string => dateTime.toISOString(),
    unix: (dateTime: DateTime.DateTime): Duration.Duration =>
      Moment.duration(dateTime.unix(), "seconds"),

    humanized: (dateTime: DateTime.DateTime): string =>
      stoppedInterval(Moment(), dateTime)
        .duration()
        .humanize(true),

    formatted: (
      dateTime: DateTime.DateTime,
      args: { template: string }
    ): string =>
      dateTime.tz(`${process.env.MAGIC_TIME_ZONE}`).format(args.template)
  },

  Time__FormattedDuration: {
    humanized: (duration: Duration.Duration): string => duration.humanize(),

    milliseconds: (duration: Duration.Duration): number =>
      duration.asMilliseconds(),

    seconds: (duration: Duration.Duration): number => duration.asSeconds(),
    minutes: (duration: Duration.Duration): number => duration.asMinutes(),
    hours: (duration: Duration.Duration): number => duration.asHours(),
    days: (duration: Duration.Duration): number => duration.asDays(),
    weeks: (duration: Duration.Duration): number => duration.asWeeks(),
    months: (duration: Duration.Duration): number => duration.asMonths(),
    years: (duration: Duration.Duration): number => duration.asYears()
  }
};
