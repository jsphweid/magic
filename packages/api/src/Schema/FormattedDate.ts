import gql from "graphql-tag";
import Moment from "moment-timezone";

export const schema = gql`
  type FormattedDate {
    """
    Unix epoch time in seconds

    _e.g._ 1535584446
    """
    unix: Int!

    """
    ISO 8601 formatted date

    _e.g._ 2018-08-30T00:06:53+00:00
    """
    ISO: String!

    """
    Date formatted using a valid [Moment.js format](https://momentjs.com/docs/#/displaying/format/)

    _e.g._ \`h:mm A\` becomes \`8:28 PM\`
    """
    formatted(format: String = "h:mm A, dddd, MMMM Do, YYYY"): String!
  }
`;

export type FormattedDate = Moment.Moment;

export const resolve = {
  unix: (source: FormattedDate): number => Math.round(source.valueOf() / 1000),
  ISO: (source: FormattedDate): string => source.toISOString(),

  formatted: (source: FormattedDate, args: { format: string }): string =>
    Moment.tz(source, `${process.env.TIME_ZONE}`).format(args.format)
};
