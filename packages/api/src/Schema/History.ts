import { option as Option } from "fp-ts";
import gql from "graphql-tag";
import _ from "lodash/fp";
import Moment from "moment";

import * as Toggl from "../Toggl";
import * as Utility from "../Utility";
import * as Context from "./Context";
import * as Narrative from "./Narrative";
import * as Tag from "./Tag";
import * as Time from "./Time";

export const schema = gql`
  type History implements Time__Timed {
    time: Time__Time!
    narratives: [Narrative!]!
  }
`;

export interface History {
  interval: Time.Interval;
  narratives: Narrative.Narrative[];
}

export const getFromSelection = async (
  context: Context.Context,
  selection: {
    tags: Tag.Selection;
    time: Time.Selection;
  }
): Promise<History> => {
  /*
    The default `start` is actually the start of the latest time entry when
    no `start` was provided, but we need to grab a small list of time entries
    to know about the latest time entry
  */
  const recentEntries = (await Toggl.Entry.getInterval(
    selection.time.start.getOrElseL(() => Moment().subtract(1, "days")),
    selection.time.stop.getOrElseL(() => Moment())
  )).getOrElseL(Utility.throwError);

  const entriesToInclude =
    selection.time.start.isNone() && recentEntries.length > 0
      ? [recentEntries[0]]
      : recentEntries;

  const narratives: Narrative.Narrative[] = [];
  for (const entry of entriesToInclude) {
    const tags = (await context.tagLoader.loadMany(
      Option.fromNullable(entry.tags).getOrElse([])
    )).map(result => result.getOrElseL(Utility.throwError));

    const start = Moment(entry.start);

    // if (
    //   _.intersection(selection.tags.include.names, tags.map(({ name }) => name))
    //     .length === 0 &&
    //   _.intersection(selection.tags.exclude.ids, tags.map(({ ID }) => ID))
    //     .length === 0
    // ) {
    //   continue;
    // }

    narratives.push({
      ID: `${entry.id}`,
      metadata: {
        created: start,
        updated: Moment(entry.at)
      },
      time: Option.fromNullable(entry.stop).fold(
        Time.ongoingInterval(start),
        stop => Time.stoppedInterval(start, Moment(stop))
      ),
      description: Option.fromNullable(entry.stop).getOrElseL(() =>
        Narrative.descriptionFromTags(tags)
      ),
      tags
    });
  }

  // Use the `start` of the first time entry when none was provided
  const start = selection.time.start.getOrElse(
    Option.fromNullable(narratives[0])
      .map(firstNarrative => firstNarrative.time.start)
      .getOrElseL(Moment)
  );

  const interval = selection.time.stop.foldL(
    () => Time.ongoingInterval(start),
    stop => Time.stoppedInterval(start, stop)
  );

  return { interval, narratives };
};
