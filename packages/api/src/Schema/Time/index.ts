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
  scalar Time_Date
  scalar Time_Duration
  scalar Time_Milliseconds

  interface Time_Timed {
    timing: Time_Timing!
  }

  input Time_Selection {
    start: Time_Date
    duration: Time_Duration
    stop: Time_Date
  }

  union Time_Timing = Time_Instant | Time_OngoingInterval | Time_StoppedInterval

  interface Time_Occurrence {
    start: Time_FormattedDate!
  }

  type Time_Instant implements Time_Occurrence {
    start: Time_FormattedDate!
  }

  interface Time_Interval {
    duration: Time_FormattedDuration!
  }

  type Time_OngoingInterval implements Time_Occurrence & Time_Interval {
    start: Time_FormattedDate!
    duration: Time_FormattedDuration!
  }

  type Time_StoppedInterval implements Time_Occurrence & Time_Interval {
    start: Time_FormattedDate!
    duration: Time_FormattedDuration!
    stop: Time_FormattedDate!
  }

  type Time_FormattedDate {
    iso: String!
    unix: Int!
    unixMilliseconds: Time_Milliseconds!
    humanized: String!
    formatted(template: String = "h:mm A, dddd, MMMM Do, YYYY"): String!
  }

  type Time_FormattedDuration {
    humanized: String!
    milliseconds: Time_Milliseconds!
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
  timing: Timing;
}

export type Timing = Instant | Interval;

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
  Time_Date: Date.resolve,
  Time_Duration: Duration.resolve,

  Time_Timed: { __resolveType: () => "Time_Timed" },
  Time_Timing: { __resolveType: () => "Time_OngoingInterval" },
  Time_Occurrence: { __resolveType: () => "Time_OngoingInterval" },
  Time_Interval: { __resolveType: () => "Time_OngoingInterval" },

  Time_OngoingInterval: {
    duration: (interval: OngoingInterval) => interval.toStopped().duration()
  },

  Time_StoppedInterval: {
    duration: (interval: StoppedInterval) => interval.duration()
  },

  Time_FormattedDate: {
    iso: (date: Date): string => date.toISOString(),
    unix: (date: Date): number => date.unix(),
    unixMilliseconds: (date: Date): number => date.valueOf(),
    humanized: (date: Date): string =>
      stoppedInterval(Moment(), date)
        .duration()
        .humanize(true),
    formatted: (date: Date, args: { template: string }): string =>
      date.tz(`${process.env.MAGIC_TIME_ZONE}`).format(args.template)
  },

  Time_FormattedDuration: {
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
