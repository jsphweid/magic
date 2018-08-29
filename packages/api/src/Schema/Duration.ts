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
  milliseconds: (source: Source) => source.asMilliseconds(),
  seconds: (source: Source) => source.asSeconds(),
  minutes: (source: Source) => source.asMinutes(),
  hours: (source: Source) => source.asHours(),
  days: (source: Source) => source.asDays(),
  weeks: (source: Source) => source.asWeeks(),
  months: (source: Source) => source.asMonths(),
  years: (source: Source) => source.asYears()
};
