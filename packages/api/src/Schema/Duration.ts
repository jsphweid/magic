import gql from "graphql-tag";
import Moment from "moment";

import * as Interval from "./Interval";

export const schema = gql`
  type Duration {
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

export type Duration = Moment.Duration;

export const resolve = {
  milliseconds: (source: Duration): number => toFixed(source.asMilliseconds()),
  seconds: (source: Duration): number => toFixed(source.asSeconds()),
  minutes: (source: Duration): number => toFixed(source.asMinutes()),
  hours: (source: Duration): number => toFixed(source.asHours()),
  days: (source: Duration): number => toFixed(source.asDays()),
  weeks: (source: Duration): number => toFixed(source.asWeeks()),
  months: (source: Duration): number => toFixed(source.asMonths()),
  years: (source: Duration): number => toFixed(source.asYears())
};

export const fromInterval = ({ start, stop }: Interval.Interval): Duration =>
  Moment.duration(stop.getOrElseL(Moment).diff(start));

const toFixed = (number: number): number => parseFloat(number.toFixed(2));
