import gql from "graphql-tag";
import Moment from "moment";
import { option as Option } from "fp-ts";

import * as Toggl from "~/toggl";
import { Interval, Tag } from "~/time";

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
  time: async (_source: undefined, args: Args): Promise<TimeSource> => {
    /*
      The default `start` is actually the start of the latest time entry when
      no `start` was provided, but we need to grab a small list of time entries
      to know about the latest time entry
    */
    const togglInterval = {
      start: args.start || Moment().subtract(1, "day"),
      stop: args.stop
    };

    // Grab all of the tags and some time entries
    const [
      { value: togglTimeEntries },
      { value: togglTags }
    ] = await Promise.all([
      Toggl.TimeEntry.getInterval(togglInterval),
      Toggl.getTags()
    ]);

    if (togglTimeEntries instanceof Error) {
      throw togglTimeEntries;
    }

    if (togglTags instanceof Error) {
      throw togglTags;
    }

    // Transform Toggl time entries into the shape expected `Time`'s resolvers
    return toTimeSource(args, togglInterval, togglTimeEntries, togglTags);
  }
};

const toTimeSource = (
  args: Args,
  togglInterval: Interval.Interval,
  togglTimeEntries: Toggl.TimeEntry.TimeEntry[],
  togglTags: Toggl.Tag[]
): TimeSource => {
  const interval = getInterval(args, togglInterval, togglTimeEntries);

  const narratives: Narrative.Source[] = [];
  const tags: TagOccurrence.Source[] = [];

  for (const timeEntry of togglTimeEntries) {
    const { start, stop } = timeEntry;
    const timeEntryInterval = Interval.fromData({ start, stop });

    // If started before our interval (with some padding), skip it
    if (
      timeEntryInterval.start.valueOf() <
      interval.start.valueOf() - 2 * 1000
    ) {
      continue;
    }

    // For now, the ID of narratives and tagOccurrences comes from Toggl
    const id = `${timeEntry.id}`;

    // If the narrative isn't empty, add it to the results
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

    // We're done if there are no tags
    if (!timeEntry.tags) {
      continue;
    }

    for (const { value: tag } of timeEntry.tags
      .map(Tag.fromName)
      .filter(Option.isSome)) {
      // Don't add tags which aren't already defined in Toggl
      const togglTag = togglTags.find(({ name }) => name === tag.name);
      if (!togglTag) {
        continue;
      }

      // The ID of the tag is its Toggl ID
      const togglID = `${togglTag.id}`;
      tags.push({
        id,
        interval: timeEntryInterval,
        tag: { id: togglID, ...tag }
      });
    }
  }

  return {
    interval,
    narratives,
    tags
  };
};

/*
  This determines the actual interval of the return data versus the interval we
  needed to grab data from Toggl
*/
const getInterval = (
  args: Args,
  togglInterval: Interval.Interval,
  togglTimeEntries: Toggl.TimeEntry.TimeEntry[]
): Interval.Interval => {
  // If we were given `start`, then the `togglInterval` is what we want
  if (args.start) {
    return togglInterval;
  }

  // Use the latest time entry's start if possible
  const [timeEntry] = togglTimeEntries;
  return !timeEntry
    ? togglInterval
    : {
        start: Moment(timeEntry.start)
      };
};
