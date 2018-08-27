import gql from "graphql-tag";

import * as Time from "~/time";

import * as Duration from "./Duration";

export const schema = gql`
  type Interval {
    start: Date!
    stop: Date
    duration: Duration!
  }
`;

type Source = Time.Interval.Interval;

export const resolvers = {
  duration: (source: Source): Duration.Source => Time.Interval.duration(source)
};
