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
  milliseconds: (source: Source): number => source.asMilliseconds(),
  seconds: (source: Source): number => source.asSeconds(),
  minutes: (source: Source): number => source.asMinutes(),
  hours: (source: Source): number => source.asHours(),
  days: (source: Source): number => source.asDays(),
  weeks: (source: Source): number => source.asWeeks(),
  months: (source: Source): number => source.asMonths(),
  years: (source: Source): number => source.asYears()
};
