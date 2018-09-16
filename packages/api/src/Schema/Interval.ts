import { option as Option } from "fp-ts";

import gql from "graphql-tag";
import Moment from "moment";

import * as Duration from "./Duration";

export const schema = gql`
  type Interval {
    start: FormattedDate!
    stop: FormattedDate
    duration: Duration!
  }
`;

export interface Source {
  start: Moment.Moment;
  stop: Moment.Moment | null;
}

export const resolve = {
  duration: (source: Source): Duration.Source => {
    // The default stop for an interval is *now*
    const stop = Option.fromNullable(source.stop).getOrElseL(() => Moment());
    return Moment.duration(stop.diff(source.start));
  }
};
