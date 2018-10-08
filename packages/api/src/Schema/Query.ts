import { option as Option } from "fp-ts";

import gql from "graphql-tag";
import Moment from "moment";

import * as Time from "./Time";

export const schema = gql`
  type Query {
    time(start: Date, stop: Date): Time!
  }
`;

export const resolve = {
  time: async (
    _source: undefined,
    args: {
      start: Moment.Moment | null;
      stop: Moment.Moment | null;
    }
  ): Promise<Time.Time> =>
    Time.fromDates(
      Option.fromNullable(args.start),
      Option.fromNullable(args.stop)
    )
};
