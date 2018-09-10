import gql from "graphql-tag";
import Moment from "moment";

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

export type Source = Moment.Duration;

export const resolve = {
  milliseconds: (source: Source): number => toFixed(source.asMilliseconds()),
  seconds: (source: Source): number => toFixed(source.asSeconds()),
  minutes: (source: Source): number => toFixed(source.asMinutes()),
  hours: (source: Source): number => toFixed(source.asHours()),
  days: (source: Source): number => toFixed(source.asDays()),
  weeks: (source: Source): number => toFixed(source.asWeeks()),
  months: (source: Source): number => toFixed(source.asMonths()),
  years: (source: Source): number => toFixed(source.asYears())
};

const toFixed = (number: number): number => parseFloat(number.toFixed(2));
