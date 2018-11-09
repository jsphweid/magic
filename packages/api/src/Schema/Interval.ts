import { option as Option } from "fp-ts";
import gql from "graphql-tag";
import Moment from "moment";

import * as Duration from "./Duration";
import * as FormattedDate from "./FormattedDate";

export const schema = gql`
  type Interval {
    start: FormattedDate!
    stop: FormattedDate
    duration: Duration!
  }
`;

export interface Interval {
  start: Moment.Moment;
  stop: Option.Option<Moment.Moment>;
}

export const resolve = {
  stop: (interval: Interval): FormattedDate.FormattedDate | null =>
    interval.stop.toNullable(),

  duration: (interval: Interval): Duration.Duration =>
    Duration.fromInterval(interval)
};
