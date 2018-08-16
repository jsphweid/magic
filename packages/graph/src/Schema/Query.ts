import _ from "lodash";
import gql from "graphql-tag";
import Moment from "moment";

import * as Toggl from "~/toggl";
import * as Time from "~/time";

import * as Narrative from "./Narrative";
import * as TagOccurrence from "./TagOccurrence";

export const schema = gql`
  type Query {
    now(start: Date, stop: Date): Time!
  }
`;

export const resolvers = {
  now: async (
    _source: never,
    args: {
      start: string | null;
      stop: string | null;
    }
  ) => {
    const start = args.start
      ? Moment(args.start)
      : Moment().subtract(2, "days");

    const interval = Time.Interval.fromStrings(start.toISOString(), args.stop);

    const [togglTimeEntries, togglTags] = await Promise.all([
      Toggl.getTimeEntries(interval),
      Toggl.getTags()
    ]);

    const sleep =
      !args.start && _.last(Time.Sleep.fromTimeEntries(togglTimeEntries));

    const narratives: Narrative.Source[] = [];
    const tagOccurrences: TagOccurrence.Source[] = [];

    for (const timeEntry of togglTimeEntries) {
      const interval = Time.Interval.fromStrings(
        timeEntry.start,
        timeEntry.stop
      );

      if (
        sleep &&
        sleep.stop &&
        sleep.stop.valueOf() >= interval.start.valueOf()
      ) {
        continue;
      }

      const id = `${timeEntry.id}`;

      if (timeEntry.description) {
        narratives.push({
          id,
          interval,
          description: timeEntry.description
        });
      }

      if (!timeEntry.tags) {
        continue;
      }

      Time.Tag.fromNames(timeEntry.tags).forEach(tag => {
        const togglTag = togglTags.find(({ name }) => name === tag.name);

        if (!togglTag) {
          return;
        }

        tagOccurrences.push({
          id,
          interval,
          tag: { id: togglTag.id, ...tag }
        });
      });
    }

    return {
      interval: {
        ...interval,
        start: sleep && sleep.stop ? sleep.stop : interval.start
      },

      narratives: narratives.length > 0 ? narratives : null,
      tagOccurrences: tagOccurrences.length > 0 ? tagOccurrences : null
    };
  }
};
