import { option as Option } from "fp-ts";

import gql from "graphql-tag";
import Moment from "moment";

import * as Utility from "../Utility";
import * as Toggl from "../Toggl";
import * as Interval from "./Interval";
import * as Narrative from "./Narrative";
import * as TagOccurrence from "./TagOccurrence";
import * as Tag from "./Tag";

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

  entries: Toggl.Entry.Entry[];
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

/*
  Toggl stores both the narrative and tags as one `TimeEntry` entity. This
  isn't how magic represents time (narratives and tags are independent) so we
  need to seperate time entries to fake the correct shape of the data until
  Toggl is no longer in use.
*/
const togglDataToSource = (togglData: TogglData): Source =>
  togglData.entries.reduce<Source>(
    (previous, entry) => {
      const interval = {
        start: Moment(entry.start),
        stop: Option.fromNullable(entry.stop)
          .map(stop => Moment(stop))
          .toNullable()
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

      // Any unrecognized tags are thrown so we know to add it ASAP
      const tagOccurrences = [
        ...previous.tagOccurrences,
        ...entry.tags.map(name =>
          Option.fromNullable(
            togglData.tags.find(togglTag => togglTag.name === name)
          )
            .map(({ name }) => ({
              ID,
              interval,
              tag: Tag.sourceFromName(name)
            }))
            .getOrElseL(() =>
              Utility.throwError(new Error(`"${name}" isn't defined in Toggl.`))
            )
        )
      ];

      return { ...previous, narratives, tagOccurrences };
    },
    {
      interval: togglData.interval,
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
    interval: { start, stop },
    entries: entries.mapLeft(Utility.throwError).value,
    tags: tags.mapLeft(Utility.throwError).value
  };
};
