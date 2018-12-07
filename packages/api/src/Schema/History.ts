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
    history(time: Time__Selection!, tags: Tag__Selection): History!
  }
`;

export interface History {
  time: Time.Time;
  narratives: Narrative.Narrative[];
}

export const resolvers = {
  History__Query: {
    history: async (
      _source: undefined,
      args: {
        time?: Time.Selection;
        tags?: DeepPartial<Tag.Selection>;
      },
      context: Context.Context
    ): Promise<History> => {
      /*
        The default `start` is actually the start of the latest time entry when
        no `start` was provided, but we need to grab a small list of time entries
        to know about the latest time entry
      */
      const time = args.time
        ? Time.fromSelection(args.time)
        : Time.stoppedInterval(context.now.subtract(1, "day"));

      const recentEntries = (await Toggl.Entry.getInterval(
        time.start,
        Time.isStoppedInterval(time) ? time.stop : context.now
      )).getOrElseL(Utility.throwError);

      // If no time was selected, default to the most recent narrative's time
      const entriesToInclude =
        !args.time && recentEntries.length > 0
          ? [recentEntries[0]]
          : recentEntries;

      const selection = {
        tags: Tag.defaultSelection(args.tags).getOrElseL(Utility.throwError)
      };

      const narratives: Narrative.Narrative[] = [];
      for (const entry of entriesToInclude) {
        const isMissingIncludedTags =
          selection.tags.include.names.length > 0 &&
          !Tag.isMatchForNames(selection.tags.include.names, tags);

        const containsExcludedTags =
          selection.tags.exclude.names.length > 0 &&
          Tag.isMatchForNames(selection.tags.exclude.names, tags);

        if (isMissingIncludedTags || containsExcludedTags) {
          continue;
        }

        const description =
          entry.description || Narrative.descriptionFromTags(tags);

        const start = Moment(entry.start);
        const time = entry.stop
          ? Time.stoppedInterval(start, Moment(entry.stop))
          : Time.ongoingInterval(start);

        const ID = `${entry.id}`;
        const metadata = {
          created: start,
          updated: Moment(entry.at)
        };

        narratives.push({ ID, metadata, time, description, tags });
      }

      return {
        time:
          // Use the `start` of the first time entry when none was provided
          args.time && (args.time.start || args.time.duration)
            ? time
            : {
                ...time,
                start: Option.fromNullable(narratives[0])
                  .map(firstNarrative => firstNarrative.time.start)
                  .getOrElse(context.now)
              },

        narratives
      };
    }
  }
};
