import { option as Option } from "fp-ts";
import gql from "graphql-tag";
import Moment from "moment";

import * as Toggl from "../Toggl";
import * as Utility from "../Utility";
import * as Interval from "./Interval";
import * as Narrative from "./Narrative";
import * as Tag from "./Tag";
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

export interface Time {
  interval: Interval.Interval;
  narratives: Narrative.Narrative[];
  tagOccurrences: TagOccurrence.Source[];
}

interface TogglData {
  entries: Toggl.Entry.Entry[];
  tags: Toggl.Tag[];
}

export const fromDates = async (
  start: Option.Option<Moment.Moment>,
  stop: Option.Option<Moment.Moment>
): Promise<Time> => {
  /*
    The default `start` is actually the start of the latest time entry when
    no `start` was provided, but we need to grab a small list of time entries
    to know about the latest time entry
  */
  const togglData = await getTogglData(
    start.getOrElseL(() => Moment().subtract(2, "days")),
    stop.getOrElseL(() => Moment())
  );

  return fromTogglData(
    // Use the orginal start if it was provided
    start.getOrElseL(() => Moment(togglData.entries[0].start)),
    stop,
    togglData
  );
};

/*
  Toggl stores both the narrative and tags as one `TimeEntry` entity. This
  isn't how magic represents time (narratives and tags are independent) so we
  need to seperate time entries to fake the correct shape of the data until
  Toggl is no longer in use.
*/
const fromTogglData = (
  start: Moment.Moment,
  stop: Option.Option<Moment.Moment>,
  togglData: TogglData
): Time =>
  togglData.entries.reduce<Time>(
    (previous, entry) => {
      const interval = {
        start: Moment(entry.start),
        stop: Option.fromNullable(entry.stop).map(stop => Moment(stop))
      };

      // If started before our interval (with some padding), skip it
      if (interval.start.valueOf() < start.valueOf() - 2 * 1000) {
        return previous;
      }

      /*
        Use the time entry's id as for the tag occurrences and narratives while
        we're still using Toggl
      */
      const ID = `${entry.id}`;

      // If the narrative is empty, don't add it to the results
      const narratives = Option.fromNullable(entry.description)
        .map(
          description =>
            description.replace(/ /g, "") !== ""
              ? [...previous.narratives, { ID, interval, description }]
              : previous.narratives
        )
        .getOrElse(previous.narratives);

      // Any unrecognized tags are thrown so we know to add them ASAP
      const tagOccurrences = [
        ...previous.tagOccurrences,
        ...Option.fromNullable(entry.tags)
          .getOrElse([])
          .map(name =>
            Option.fromNullable(
              togglData.tags.find(togglTag => togglTag.name === name)
            )
              .map(({ name }) => ({
                ID,
                interval,
                tag: Tag.fromName(name).getOrElseL(Utility.throwError)
              }))
              .getOrElseL(() =>
                Utility.throwError(
                  new Error(`"${name}" isn't defined in Toggl.`)
                )
              )
          )
      ];

      return { ...previous, narratives, tagOccurrences };
    },
    {
      interval: { start, stop },
      narratives: [],
      tagOccurrences: []
    }
  );

/*
  Both time entries and the tags defined in Toggl are needed to generate the
  `Time` type
*/
const getTogglData = async (
  start: Moment.Moment,
  stop: Moment.Moment
): Promise<TogglData> => {
  const [entries, tags] = await Promise.all([
    Toggl.Entry.getInterval(start, stop),
    Toggl.getTags()
  ]);

  return {
    entries: entries.mapLeft(Utility.throwError).value,
    tags: tags.mapLeft(Utility.throwError).value
  };
};
