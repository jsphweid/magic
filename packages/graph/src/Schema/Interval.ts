import gql from "graphql-tag";

import * as Time from "~/time";

export const schema = gql`
  type Interval {
    start: Date!
    stop: Date
    duration: Duration!
  }
`;

export const resolvers = {
  start: (source: Time.Interval.Interval) => source.start.toISOString(),
  stop: (source: Time.Interval.Interval) =>
    source.stop ? source.stop.toISOString() : null,

  duration: (source: Time.Interval.Interval) => Time.Interval.duration(source)
};
