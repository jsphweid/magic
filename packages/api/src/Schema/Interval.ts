import gql from "graphql-tag";

import { Interval } from "~/time";

import * as Duration from "./Duration";

export const schema = gql`
  type Interval {
    start: FormattedDate!
    stop: FormattedDate
    duration: Duration!
  }
`;

type Source = Interval.Interval;

export const resolve = {
  duration: (source: Source): Duration.Source => Interval.duration(source)
};
