import { option as Option } from "fp-ts";
import gql from "graphql-tag";
import Moment from "moment";

import * as Toggl from "../Toggl";
import * as Utility from "../Utility";
import * as Context from "./Context";
import * as Narrative from "./Narrative";
import * as TagOccurrence from "./TagOccurrence";
import * as Time from "./Time";

export const schema = gql`
  type History implements HasInterval {
    interval: Interval!
    narratives: [Narrative!]!
    tagOccurrences: [TagOccurrence!]!
  }
`;

export interface History {
  interval: Time.Interval;
  narratives: Narrative.Narrative[];
  tagOccurrences: TagOccurrence.TagOccurrence[];
}

export const getFromDates = async (
  context: Context.Context,
  start: Option.Option<Time.Date>,
  stop: Option.Option<Time.Date>
): Promise<History> => {
  start.map(start =>
    stop.map(
      stop =>
        start.valueOf() > stop.valueOf() &&
        Utility.throwError(new Error("`stop` can't be larger than `start`"))
    )
  );

  /*
    The default `start` is actually the start of the latest time entry when
    no `start` was provided, but we need to grab a small list of time entries
    to know about the latest time entry
  */
  const recentEntries = (await Toggl.Entry.getInterval(
    start.getOrElseL(() => Moment().subtract(2, "days")),
    stop.getOrElseL(() => Moment())
  )).getOrElseL(Utility.throwError);

  const entriesToInclude =
    start.isNone() && recentEntries.length > 0
      ? [recentEntries[0]]
      : recentEntries;

  const narratives: Narrative.Narrative[] = [];
  const tagOccurrences: TagOccurrence.TagOccurrence[] = [];

  // If there is only on
  for (const entry of entriesToInclude) {
    const interval = {
      start: Moment(entry.start),
      stop: Option.fromNullable(entry.stop).map(stop => Moment(stop))
    };

    /*
      Use the time entry's `id` for tag occurrences and narratives while we're
      still using Toggl
    */
    const ID = `${entry.id}`;

    // If the narrative isn't empty, add it the history
    Option.fromNullable(entry.description).map(
      description =>
        description.replace(/ /g, "") !== "" &&
        narratives.push({ ID, interval, description })
    );

    // Add any tag occurrences to the history
    (await context.tagLoader.loadMany(
      Option.fromNullable(entry.tags).getOrElse([])
    )).forEach(tag =>
      tagOccurrences.push({
        ID,
        interval,
        tag: tag.getOrElseL(Utility.throwError)
      })
    );
  }

  return {
    interval: {
      start: start.getOrElse(
        // Use the `start` of the first time entry when none was provided
        Option.fromNullable(tagOccurrences[0])
          .map(firstTagOccurrence => firstTagOccurrence.interval.start)
          .getOrElseL(() => Moment())
      ),
      stop
    },

    narratives,
    tagOccurrences
  };
};
