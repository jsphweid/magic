import _ from "lodash";
import gql from "graphql-tag";
import Moment from "moment";

import * as Toggl from "~/toggl";
import * as Time from "~/time";

import { Source as TimeSource } from "../Time";

import * as Narrative from "../Narrative";
import * as TagOccurrence from "../TagOccurrence";

export const schema = gql`
  type Query {
    now(start: Date, stop: Date): Time!
  }
`;

interface Args {
  start: string | null;
  stop: string | null;
}

interface Context {
  secrets: {
    toggl: {
      token: string;
      workspaceId: string;
    };
  };
}

export const resolvers = {
  now: async (_source: never, args: Args, context: Context) => {
    const togglInterval = {
      start: args.start ? Moment(args.start) : Moment().subtract(2, "days"),
      stop: args.stop ? Moment(args.stop) : null
    };

    const [togglTimeEntries, togglTags] = await Promise.all([
      Toggl.getTimeEntries(context.secrets.toggl, togglInterval),
      Toggl.getTags(context.secrets.toggl)
    ]);

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
    const tagInterval = Time.Interval.fromData({ start, stop });

    if (interval.valueOf() >= tagInterval.start.valueOf()) {
      continue;
    }

    const id = `${timeEntry.id}`;

    if (
      timeEntry.description &&
      timeEntry.description.replace(/ /g, "") !== ""
    ) {
      narratives.push({
        id,
        interval: tagInterval,
        description: timeEntry.description
      });
    }

    if (!timeEntry.tags) {
      continue;
    }

    for (const tag of Time.Tag.fromNames(timeEntry.tags)) {
      const togglTag = togglTags.find(({ name }) => name === tag.name);

      if (!togglTag) {
        continue;
      }

      tagOccurrences.push({
        id,
        interval: tagInterval,
        tag: { ...tag, id: togglTag.id }
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

  const lastSleep = _.last(Time.Sleep.fromTimeEntries(togglTimeEntries));

  if (lastSleep) {
    return { ...togglInterval, start: lastSleep.stop || Moment() };
  }

  return togglInterval;
};
