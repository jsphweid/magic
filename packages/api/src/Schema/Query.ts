import { option as Option } from "fp-ts";

import gql from "graphql-tag";
import Moment from "moment";
import * as Time from "./Time";

export const schema = gql`
  type Query {
    time(start: Date, stop: Date): Time!
  }
`;

interface Args {
  start: Moment.Moment | null;
  stop: Moment.Moment | null;
}

export const resolve = {
  time: async (_source: undefined, args: Args): Promise<Time.Source> =>
    Time.source(Option.fromNullable(args.start), Option.fromNullable(args.stop))
};
