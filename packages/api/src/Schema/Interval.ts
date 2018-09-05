import gql from "graphql-tag";

import * as Time from "~/time";

import * as Duration from "./Duration";

export const schema = gql`
  type Interval {
    start: FormattedDate!
    stop: FormattedDate
    duration: Duration!
  }
`;

type Source = Time.Interval.Interval;

export const resolve = {
  duration: (source: Source): Duration.Source => Time.Interval.duration(source)
};
