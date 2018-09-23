import { option as Option } from "fp-ts";

import gql from "graphql-tag";
import Moment from "moment";

import * as FormattedDate from "./FormattedDate";
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
  stop: Option.Option<Moment.Moment>;
}

export const resolve = {
  stop: (source: Source): FormattedDate.Source | null =>
    source.stop.toNullable(),

  duration: (source: Source): Duration.Source =>
    duration(source.start, source.stop.getOrElseL(() => Moment()))
};

export const duration = (
  start: Moment.Moment,
  stop: Moment.Moment
): Moment.Duration => Moment.duration(stop.diff(start));
