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
  type History implements HasTiming {
    timing: Timing!
    narratives: [Narrative!]!
    tagOccurrences: [TagOccurrence!]!
  }
`;

export interface History {
  interval: Time.Interval;
  narratives: Narrative.Narrative[];
  tagOccurrences: TagOccurrence.TagOccurrence[];
}

export const getFromTimeSelection = async (
  context: Context.Context,
  selection: Time.Selection
): Promise<History> => {
  /*
    The default `start` is actually the start of the latest time entry when
    no `start` was provided, but we need to grab a small list of time entries
    to know about the latest time entry
  */
  const recentEntries = (await Toggl.Entry.getInterval(
    selection.start.getOrElseL(() => Moment().subtract(2, "days")),
    selection.stop.getOrElseL(() => Moment())
  )).getOrElseL(Utility.throwError);

  const entriesToInclude =
    selection.start.isNone() && recentEntries.length > 0
      ? [recentEntries[0]]
      : recentEntries;

  const narratives: Narrative.Narrative[] = [];
  const tagOccurrences: TagOccurrence.TagOccurrence[] = [];

  for (const entry of entriesToInclude) {
    const start = Moment(entry.start);
    const interval: Time.Interval = Option.fromNullable(entry.stop).fold(
      Time.ongoingInterval(start),
      stop => Time.stoppedInterval(start, Moment(stop))
    );

    /*
      Use the time entry's `id` for tag occurrences and narratives while we're
      still using Toggl
    */
    const ID = `${entry.id}`;

    // If the narrative isn't empty, add it the history
    Option.fromNullable(entry.description).map(
      description =>
        description.replace(/ /g, "") !== "" &&
        narratives.push({ ID, timing: interval, description })
    );

    // Add any tag occurrences to the history
    (await context.tagLoader.loadMany(
      Option.fromNullable(entry.tags).getOrElse([])
    )).forEach(tag =>
      tagOccurrences.push({
        ID,
        timing: interval,
        tag: tag.getOrElseL(Utility.throwError)
      })
    );
  }

  // Use the `start` of the first time entry when none was provided
  const start = selection.start.getOrElse(
    Option.fromNullable(tagOccurrences[0])
      .map(firstTagOccurrence => firstTagOccurrence.timing.start)
      .getOrElseL(Moment)
  );

  return {
    interval: selection.stop.foldL(
      () => Time.ongoingInterval(start),
      stop => Time.stoppedInterval(start, stop)
    ),

    narratives,
    tagOccurrences
  };
};
