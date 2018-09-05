import _ from "lodash";
import gql from "graphql-tag";
import Moment from "moment";

import * as Toggl from "~/toggl";
import * as Time from "~/time";

import { Source as TimeSource } from "./Time";

import * as Narrative from "./Narrative";
import * as TagOccurrence from "./TagOccurrence";

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
  time: async (_source: any, args: Args): Promise<TimeSource> => {
    const togglInterval = {
      start: args.start || Moment().subtract(12, "hours"),
      stop: args.stop || null
    };

    const [
      { value: togglTimeEntries },
      { value: togglTags }
    ] = await Promise.all([
      Toggl.getTimeEntries(togglInterval),
      Toggl.getTags()
    ]);

    if (togglTimeEntries instanceof Error) {
      throw togglTimeEntries;
    }

    if (togglTags instanceof Error) {
      throw togglTags;
    }

    return toTimeSource(args, togglInterval, togglTimeEntries, togglTags);
  }
};

const toTimeSource = (
  args: Args,
  togglInterval: Time.Interval.Interval,
  togglTimeEntries: Toggl.TimeEntry[],
  togglTags: Toggl.Tag[]
): TimeSource => {
  const interval = getInterval(args, togglInterval, togglTimeEntries);

  const narratives: Narrative.Source[] = [];
  const tagOccurrences: TagOccurrence.Source[] = [];

  for (const timeEntry of togglTimeEntries) {
    const { start, stop } = timeEntry;
    const timeEntryInterval = Time.Interval.fromData({ start, stop });

    if (timeEntryInterval.start.valueOf() < interval.start.valueOf()) {
      continue;
    }

    const id = `${timeEntry.id}`;

    if (
      timeEntry.description &&
      timeEntry.description.replace(/ /g, "") !== ""
    ) {
      narratives.push({
        id,
        interval: timeEntryInterval,
        description: timeEntry.description
      });
    }

    if (!timeEntry.tags) {
      continue;
    }

    for (const tag of timeEntry.tags.map(Time.Tag.fromName)) {
      if (tag.isNone()) {
        continue;
      }

      const togglTag = togglTags.find(({ name }) => name === tag.value.name);
      if (!togglTag) {
        continue;
      }

      const togglID = `${togglTag.id}`;

      tagOccurrences.push({
        id,
        interval: timeEntryInterval,
        tag: {
          id: togglID,
          ...tag.value
        }
      });
    }
  }

  return {
    interval,
    narratives,
    tagOccurrences
  };
};

const getInterval = (
  args: Args,
  togglInterval: Time.Interval.Interval,
  togglTimeEntries: Toggl.TimeEntry[]
): Time.Interval.Interval => {
  if (args.start) {
    return togglInterval;
  }

  const [timeEntry] = togglTimeEntries;
  if (timeEntry) {
    return {
      start: Moment(timeEntry.start)
    };
  }

  return togglInterval;
};
