import { option as Option } from "fp-ts";
import gql from "graphql-tag";
import Moment from "moment-timezone";

import * as Date from "./Date";
import * as Duration from "./Duration";

export const schema = gql`
  scalar Date
  scalar Duration
  scalar Int64

  type Interval {
    start: FormattedDate!
    duration: FormattedDuration
    stop: FormattedDate
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

export interface Interval {
  start: Date;
  stop: Option.Option<Date>;
}

export type Date = Moment.Moment;
export type Duration = Moment.Duration;

export const resolvers = {
  Date: Date.resolve,
  Duration: Duration.resolve,

  Interval: {
    duration: ({ start, stop }: Interval): Duration | null =>
      stop.map(stop => durationFromDates(start, stop)).toNullable(),

    stop: ({ stop }: Interval): Date | null => stop.toNullable()
  },

  FormattedDate: {
    iso: (date: Date): string => date.toISOString(),
    unix: (date: Date): number => date.unix(),
    unixMilliseconds: (date: Date): number => date.valueOf(),

    humanized: (date: Date): string =>
      durationFromDates(Moment(), date).humanize(true),

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

export const durationFromInterval = ({ start, stop }: Interval): Duration =>
  durationFromDates(start, stop.getOrElseL(Moment));

export const durationFromDates = (start: Date, stop: Date): Duration =>
  Moment.duration(stop.diff(start));
