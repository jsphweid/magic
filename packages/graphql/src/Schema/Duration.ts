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

export const resolvers = {
  milliseconds: (source: Moment.Duration) => source.asMilliseconds(),
  seconds: (source: Moment.Duration) => source.asSeconds(),
  minutes: (source: Moment.Duration) => source.asMinutes(),
  hours: (source: Moment.Duration) => source.asHours(),
  days: (source: Moment.Duration) => source.asDays(),
  weeks: (source: Moment.Duration) => source.asWeeks(),
  months: (source: Moment.Duration) => source.asMonths(),
  years: (source: Moment.Duration) => source.asYears()
};
