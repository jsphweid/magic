import gql from "graphql-tag";
import Moment from "moment";

import * as Toggl from "~/Toggl";
import * as Time from "~/Time";

import * as Query from "./Query";
import { Source as TimeSource } from "./Time";

export const schema = gql`
  type Mutation {
    startTime(
      start: Date
      stop: Date
      narrative: String
      tags: [String!]
    ): Time!
  }
`;

interface Args {
  start: Moment.Moment | null;
  stop: Moment.Moment | null;
  narrative: string | null;
  tags: string[] | null;
}

export const resolve = {
  startTime: async (_source: never, args: Args): Promise<TimeSource> => {
    const interval = {
      start: args.start || Moment(),
      stop: args.stop
    };

    const newTimeEntry = {
      description: args.narrative || undefined,
      tags: args.tags || []
    };

    console.log([
      args,
      interval,
      Time.Interval.isStopped(interval),
      { ...newTimeEntry, interval }
    ]);

    const { value: timeEntry } = Time.Interval.isStopped(interval)
      ? await Toggl.createTimeEntry({ ...newTimeEntry, interval })
      : await Toggl.startTimeEntry(newTimeEntry);

    if (timeEntry instanceof Error) {
      throw timeEntry;
    }

    if (!args.start && !Time.Interval.isStopped(interval)) {
      const { value: updatedTimeEntry } = await Toggl.updateTimeEntry({
        ...timeEntry,
        start: interval.start.toISOString()
      });

      if (updatedTimeEntry instanceof Error) {
        throw updatedTimeEntry;
      }
    }

    return Query.resolve.time(undefined, {
      start: args.start,
      stop: args.stop
    });
  }
};
