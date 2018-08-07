import _ from "lodash";
import Moment from "moment";

import * as Toggl from "~/toggl";
import * as Tags from "~/symbols";

export const resolvers = {
  Query: {
    now: async (_source: never, args: { start?: string; stop?: string }) => {
      const start = args.start
        ? Moment(args.start)
        : Moment().subtract(1, "hour");

      const stop = args.stop ? Moment(args.stop) : Moment();

      const allTags = await Toggl.getTags();

      const { narratives, tags } = (await Toggl.getTimeEntries(
        start,
        stop
      )).reduce<{ narratives: any; tags: any }>(
        (acc, timeEntry) => {
          const interval = {
            start: Moment(timeEntry.start),
            stop: Moment(timeEntry.stop)
          };

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
            tags: [
              ...acc.tags,
              ..._
                .intersectionBy(
                  allTags,
                  Tags.expandConnections(timeEntry.tags),
                  "name"
                )
                .map(tag => ({ id: timeEntry.id, interval, tag }))
            ]
          };
        },
        {
          narratives: [],
          tags: []
        }
      );

      return {
        interval: {
          start,
          stop
        },
        statistics: {
          start,
          stop
        },
        narratives,
        tagOccurences: tags
      };
    }
  },

  Tag: {
    score: (source: Toggl.Tag) => {
      const tag = Tags.all.find(({ name }) => name === source.name);
      switch ((tag && tag.score) || 0) {
        case 3:
          return "POSITIVE_HIGH";
        case 2:
          return "POSITIVE_MEDIUM";
        case 1:
          return "POSITIVE_LOW";
        case 0:
          return "NEUTRAL";
        case -1:
          return "NEGATIVE_LOW";
        case -2:
          return "NEGATIVE_MEDIUM";
        case -3:
          return "NEGATIVE_HIGH";
      }
    }
  },

  Interval: {
    start: (source: { start: Moment.Moment }) => source.start.toISOString(),
    stop: (source: { stop: Moment.Moment }) => source.stop.toISOString(),
    duration: (source: { start: Moment.Moment; stop: Moment.Moment }) =>
      Moment.duration(source.stop.diff(source.start))
  },

  Duration: {
    milliseconds: (source: Moment.Duration) => source.asMilliseconds(),
    seconds: (source: Moment.Duration) => source.asSeconds(),
    minutes: (source: Moment.Duration) => source.asMinutes(),
    hours: (source: Moment.Duration) => source.asHours(),
    days: (source: Moment.Duration) => source.asDays(),
    weeks: (source: Moment.Duration) => source.asWeeks(),
    months: (source: Moment.Duration) => source.asMonths(),
    years: (source: Moment.Duration) => source.asYears()
  }
};
