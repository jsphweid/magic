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
  time: async (_source: undefined, args: Args): Promise<TimeSource> => {
    /*
      the default `start` is actually the start of the latest time entry when
      no `start` was provided, but we need to grab a small list of time entries
      to know about the latest time entry
    */
    const togglInterval = {
      start: args.start || Moment().subtract(12, "hours"),
      stop: args.stop
    };

    // grab all of the tags and some time entries
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

    // transform Toggl time entries into the shape expected by the schema
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

    // if started before our interval (with some padding), skip it
    if (
      timeEntryInterval.start.valueOf() <
      interval.start.valueOf() - 2 * 1000
    ) {
      continue;
    }

    // for now, the ID of narratives and tagOccurrences comes from the Toggl
    const id = `${timeEntry.id}`;

    // if the narrative isn't empty, add it to the results
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

    // we're done if there are no tags
    if (!timeEntry.tags) {
      continue;
    }

    for (const tag of timeEntry.tags.map(Time.Tag.fromName)) {
      // if the tag isn't defined in Magic (not just Toggl), skip it
      if (tag.isNone()) {
        continue;
      }

      // don't add tags which aren't already defined in Toggl
      const togglTag = togglTags.find(({ name }) => name === tag.value.name);
      if (!togglTag) {
        continue;
      }

      // the ID of the tag is its Toggl ID
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

/*
  this determines the actual interval of the return data versus the interval we
  needed to grab data from Toggl
*/
const getInterval = (
  args: Args,
  togglInterval: Time.Interval.Interval,
  togglTimeEntries: Toggl.TimeEntry[]
): Time.Interval.Interval => {
  // if we were given `start`, then the `togglInterval` is what we want
  if (args.start) {
    return togglInterval;
  }

  // use the latest time entry's start if possible
  const [timeEntry] = togglTimeEntries;
  return !timeEntry
    ? togglInterval
    : {
        start: Moment(timeEntry.start)
      };
};
