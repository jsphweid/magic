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
  stop: (source: Interval): FormattedDate.FormattedDate | null =>
    source.stop.toNullable(),

  duration: (source: Interval): Duration.Duration =>
    Duration.fromInterval(source)
};
