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
  scalar Date
  scalar Duration
  scalar Int64

  union Timing = Instant | OngoingInterval | StoppedInterval

  interface HasTiming {
    timing: Timing!
  }

  interface Occurrence {
    start: FormattedDate!
  }

  type Instant implements Occurrence {
    start: FormattedDate!
  }

  interface Interval {
    duration: FormattedDuration!
  }

  type OngoingInterval implements Occurrence & Interval {
    start: FormattedDate!
    duration: FormattedDuration!
  }

  type StoppedInterval implements Occurrence & Interval {
    start: FormattedDate!
    duration: FormattedDuration!
    stop: FormattedDate!
  }

  type FormattedDate {
    iso: String!
    unix: Int!
    unixMilliseconds: Int64!
    humanized: String!
    formatted(template: String = "h:mm A, dddd, MMMM Do, YYYY"): String!
  }

  type FormattedDuration {
    humanized: String!
    milliseconds: Int!
    seconds: Float!
    minutes: Float!
    hours: Float!
    days: Float!
    weeks: Float!
    months: Float!
    years: Float!
  }
`;

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
  Date: Date.resolve,
  Duration: Duration.resolve,

  Timing: {
    __resolveType: (_timing: Interval): string => "OngoingInterval"
  },

  Occurrence: {
    __resolveType: (_occurrence: Instant): string => "OngoingInterval"
  },

  Interval: {
    __resolveType: (_interval: Interval): string => "OngoingInterval"
  },

  OngoingInterval: {
    duration: (interval: OngoingInterval) => interval.toStopped().duration()
  },

  StoppedInterval: {
    duration: (interval: StoppedInterval) => interval.duration()
  },

  FormattedDate: {
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

  FormattedDuration: {
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

ongoingInterval(Moment()).toStopped();
