import gql from "graphql-tag";
import Moment from "moment-timezone";

export const schema = gql`
  type FormattedDate {
    type FormattedDate {
    iso: String!
    unix: Int!
    unixMilliseconds: Int64!
    humanized: String!
    format(template: String = "h:mm A, dddd, MMMM Do, YYYY"): String!
  }

  scalar Int64
`;

export type FormattedDate = Moment.Moment;

export const resolve = {
  iso: (source: FormattedDate): string => source.toISOString(),
  unix: (source: FormattedDate): number => source.unix(),
  unixMilliseconds: (source: FormattedDate): number => source.valueOf(),

  humanized: (source: FormattedDate): string =>
    Moment.duration(source.diff(Moment())).humanize(true),

  format: (source: FormattedDate, args: { template: string }): string =>
    source.format(args.template)
};
