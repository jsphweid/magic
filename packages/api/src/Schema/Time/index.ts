import gql from "graphql-tag";
import Moment from "moment";

import * as Date from "./Scalar/Date";
import * as Duration from "./Scalar/Duration";

export { Batches, fromInterval as batchesFromInterval } from "./Batches";

export const schema = gql`
  scalar Time__Date
  scalar Time__Duration
  scalar Time__MS

  interface Time__Timed {
    time: Time__Occurrence!
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

  input Time__Selection {
    start: Time__Date
    duration: Time__Duration
    stop: Time__Date
  }

  type Time__FormattedDate {
    unix: Time__FormattedDuration!
    iso: String!
    humanized: String!
    formatted(template: String = "h:mm A, dddd, MMMM Do, YYYY"): String!
  }

  type Time__FormattedDuration {
    humanized: String!
    milliseconds: Time__MS!
    seconds: Float!
    minutes: Float!
    hours: Float!
    days: Float!
    weeks: Float!
    months: Float!
    years: Float!
  }
`;

export type Date = Moment.Moment;
export type Duration = Moment.Duration;
export type Time = Instant | OngoingInterval | StoppedInterval;

export interface Timed {
  time: Time;
}

export interface Selection {
  start?: Date;
  duration?: Duration;
  stop?: Date;
}

interface Occurrence<Kind extends OccurrenceKind> {
  kind: Kind;
  start: Date;
}

const enum OccurrenceKind {
  Instant = "Instant",
  OngoingInterval = "OngoingInterval",
  StoppedInterval = "StoppedInterval"
}

export type Instant = Occurrence<OccurrenceKind.Instant>;
export type OngoingInterval = Occurrence<OccurrenceKind.OngoingInterval>;
export type StoppedInterval = Occurrence<OccurrenceKind.StoppedInterval> & {
  stop: Date;
};

export const isInstant = (time: Time): time is Instant =>
  time.kind === "Instant";

export const isOngoingInterval = (time: Time): time is OngoingInterval =>
  time.kind === "OngoingInterval";

export const isStoppedInterval = (time: Time): time is StoppedInterval =>
  time.kind === "StoppedInterval";

export const instant = (start?: Date | null): Instant => ({
  kind: OccurrenceKind.Instant,
  start: start || Moment()
});

export const ongoingInterval = (start?: Date | null): OngoingInterval => ({
  ...instant(start),
  kind: OccurrenceKind.OngoingInterval
});

export const stoppedInterval = (
  start?: Date | null,
  stop?: Date | null
): StoppedInterval => toStoppedInterval(ongoingInterval(start), stop);

export const toStoppedInterval = (
  time: Time,
  stop?: Date | null
): StoppedInterval => ({
  ...time,
  kind: OccurrenceKind.StoppedInterval,
  stop: stop || (isStoppedInterval(time) ? time.stop : Moment())
});

export const fromSelection = (selection: Selection): Time =>
  selection.start && selection.stop
    ? stoppedInterval(selection.start, selection.stop)
    : selection.start && selection.duration
    ? stoppedInterval(
        selection.start,
        Moment(selection.start).add(selection.duration)
      )
    : selection.stop && selection.duration
    ? stoppedInterval(
        Moment(selection.stop).subtract(selection.duration),
        selection.stop
      )
    : selection.start
    ? ongoingInterval(selection.start)
    : instant();

export const duration = (time: Time): Duration =>
  Moment.duration(
    (isStoppedInterval(time) ? time.stop : Moment()).diff(time.start)
  ).abs();

export const resolvers = {
  ...Date.resolvers,
  ...Duration.resolvers,

  Time__Timed: { __resolveType: () => "Time__Timed" },
  Time__Occurrence: {
    __resolveType: (time: Time): string => `Time__${time.kind}`
  },

  Time__Interval: { __resolveType: () => "Time__Interval" },
  Time__OngoingInterval: { duration },
  Time__StoppedInterval: { duration },

  Time__FormattedDate: {
    unix: (date: Date): Duration => Moment.duration(date.valueOf(), "ms"),
    iso: (date: Date): string => date.toISOString(),
    humanized: (date: Date): string => duration(instant(date)).humanize(true),
    formatted: (date: Date, args: { template: string }): string =>
      date.format(args.template)
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
