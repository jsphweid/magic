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
    time: Time!
    narratives: [Narrative!]!
  }

  type History__Query {
    history(time: Time__Selection!, tags: Tag__Filter): History!
  }
`;

export interface History {
  interval: Time.Interval;
  narratives: Narrative.Narrative[];
}

export const resolvers = {
  History__Query: {
    history: async (
      _source: undefined,
      args: {
        time: Time.SelectionGraphQLArgs;
        tags: Tag.FilterArgs | null;
      },
      context: Context.Context
    ): Promise<History> =>
      getFromSelection(context, {
        time: Time.selectionFromGraphQLArgs(args.time).getOrElseL(
          Utility.throwError
        ),
        tags: Tag.filterFromArgs(args.tags).getOrElseL(Utility.throwError)
      })
  }
};

export const getFromSelection = async (
  context: Context.Context,
  selection: {
    tags: Tag.Filter;
    time: Time.Selection;
  }
): Promise<History> => {
  /*
    The default `start` is actually the start of the latest time entry when
    no `start` was provided, but we need to grab a small list of time entries
    to know about the latest time entry
  */
  const recentEntries = (await Toggl.Entry.getInterval(
    selection.time.start.getOrElseL(() => Moment().subtract(2, "days")),
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

    if (
      (selection.tags.include.names.length > 0 &&
        !Tag.isMatchForNames(selection.tags.include.names, tags)) ||
      (selection.tags.exclude.names.length > 0 &&
        Tag.isMatchForNames(selection.tags.exclude.names, tags))
    ) {
      continue;
    }

    const start = Moment(entry.start);

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
      description: Option.fromNullable(entry.description).getOrElseL(() =>
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
