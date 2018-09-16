import { option as Option } from "fp-ts";

import gql from "graphql-tag";
import Moment from "moment";

import * as Toggl from "../Toggl";

import * as Interval from "./Interval";
import * as Narrative from "./Narrative";
import * as TagOccurrence from "./TagOccurrence";

export const schema = gql`
  type Time implements HasInterval {
    interval: Interval!
    narratives(sort: Sort = DESCENDING): [Narrative!]!
    tagOccurrences: [TagOccurrence!]!
  }

  enum Sort {
    ASCENDING
    DESCENDING
  }
`;

export interface Source {
  interval: Interval.Source;

  narratives: Narrative.Source[];
  tagOccurrences: TagOccurrence.Source[];
}

interface TogglData {
  interval: {
    start: Moment.Moment;
    stop: Moment.Moment;
  };

  timeEntries: Toggl.TimeEntry.TimeEntry[];
  tags: Toggl.Tag[];
}

export const source = async (
  start: Option.Option<Moment.Moment>,
  stop: Option.Option<Moment.Moment>
): Promise<Source> => {
  /*
    The default `start` is actually the start of the latest time entry when
    no `start` was provided, but we need to grab a small list of time entries
    to know about the latest time entry
  */
  const togglData = await getTogglData(
    start.getOrElseL(() => Moment().subtract(2, "days")),
    stop.getOrElseL(() => Moment())
  );

  const interval = {
    // Use the orginal start if it was provided
    start: start.isSome() ? start.value : togglData.interval.start,
    stop: stop.isSome() ? stop.value : null
  };

  return { ...togglDataToSource(togglData), interval };
};

const togglDataToSource = (togglData: TogglData): Source =>
  togglData.timeEntries.reduce<Source>(
    (previous, timeEntry) => {
      const interval = {
        start: Moment(timeEntry.start),
        stop: Option.fromNullable(timeEntry.stop)
          .map<Moment.Moment | null>(stop => Moment(stop))
          .getOrElse(null)
      };

      // If started before our interval (with some padding), skip it
      if (
        interval.start.valueOf() <
        togglData.interval.start.valueOf() - 2 * 1000
      ) {
        return previous;
      }

      /*
        Use the time entry's id as for the tag occurrences and narratives while
        we're still using Toggl
      */
      const id = `${timeEntry.id}`;

      const narratives =
        // If the narrative is empty, don't add it to the results
        `${timeEntry.description}`.replace(/ /g, "") === ""
          ? previous.narratives
          : [
              ...previous.narratives,
              { id, interval, description: timeEntry.description }
            ];

      const tagOccurrences = togglData.tags
        // Don't add tags which aren't defined in Toggl
        .filter(({ name }) => timeEntry.tags.includes(name))
        .map(({ name }) => ({ id, interval, tag: name }));

      return { ...previous, narratives, tagOccurrences };
    },
    {
      interval: togglData.interval,
      narratives: [],
      tagOccurrences: []
    }
  );

const getTogglData = async (
  start: Moment.Moment,
  stop: Moment.Moment
): Promise<TogglData> => {
  const [{ value: timeEntries }, { value: tags }] = await Promise.all([
    Toggl.TimeEntry.getInterval(start, stop),
    Toggl.getTags()
  ]);

  if (timeEntries instanceof Error) {
    throw timeEntries;
  }

  if (tags instanceof Error) {
    throw tags;
  }

  return {
    interval: { start, stop },
    timeEntries,
    tags
  };
};
