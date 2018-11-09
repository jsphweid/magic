import gql from "graphql-tag";
import Moment from "moment";

export const schema = gql`
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

export type FormattedDuration = Moment.Duration;

export const resolve = {
  humanized: (source: FormattedDuration): string => source.humanize(),
  milliseconds: (source: FormattedDuration): number => source.asMilliseconds(),
  seconds: (source: FormattedDuration): number => source.asSeconds(),
  minutes: (source: FormattedDuration): number => source.asMinutes(),
  hours: (source: FormattedDuration): number => source.asHours(),
  days: (source: FormattedDuration): number => source.asDays(),
  weeks: (source: FormattedDuration): number => source.asWeeks(),
  months: (source: FormattedDuration): number => source.asMonths(),
  years: (source: FormattedDuration): number => source.asYears()
};
