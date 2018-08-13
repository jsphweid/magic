import _ from "lodash";
import gql from "graphql-tag";
import Moment from "moment";

import * as Toggl from "~/Toggl";
import * as Tags from "~/symbols";

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
    const interval = extractInterval(args.start, args.stop);

    const [allTags, timeEntries] = await Promise.all([
      Toggl.getTags(),
      Toggl.getTimeEntries(interval.start, interval.stop)
    ]);

    const { narratives, tagOccurences } = extractNarrativesAndTagOccurences(
      allTags,
      timeEntries
    );

    return {
      interval,
      statistics: interval,
      narratives,
      tagOccurences
    };
  }
};

const extractInterval = (
  start: string | null,
  stop: string | null
): {
  start: Moment.Moment;
  stop: Moment.Moment | null;
} => ({
  start: start ? Moment(start) : Moment().subtract(7, "days"),
  stop: stop ? Moment(stop) : null
});

const extractNarrativesAndTagOccurences = (
  allTags: Toggl.Tag[],
  timeEntries: Toggl.TimeEntry[]
): {
  narratives: any;
  tagOccurences: any;
} =>
  timeEntries.reduce<{ narratives: any; tagOccurences: any }>(
    (acc, timeEntry) => {
      const interval = extractInterval(timeEntry.start, timeEntry.stop || null);

      if (!timeEntry.tags) {
        console.log(timeEntry);
      }

      return {
        ...acc,
        narratives: [
          ...acc.narratives,
          {
            id: timeEntry.id,
            interval,
            description: timeEntry.description
          }
        ],
        tagOccurences: [
          ...acc.tagOccurences,
          ..._.intersectionBy(
            allTags,
            Tags.expandConnections(timeEntry.tags),
            "name"
          ).map(tag => ({ id: timeEntry.id, interval, tag }))
        ]
      };
    },
    {
      narratives: [],
      tagOccurences: []
    }
  );
