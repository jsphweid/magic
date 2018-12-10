import { option as Option } from "fp-ts";
import gql from "graphql-tag";
import _ from "lodash/fp";

import * as Toggl from "../Toggl";
import * as Utility from "../Utility";
import * as Context from "./Context";
import * as Narrative from "./Narrative";
import * as Tag from "./Tag";
import * as Time from "./Time";

export const schema = gql`
  type History implements Time__Timed {
    time: Time__Occurrence!
    narratives: [Narrative!]!
  }

  type History__Query {
    all(time: Time__Selection!, tags: Tag__Filter): History!
  }
`;

export interface History {
  time: Time.Time;
  narratives: Narrative.Narrative[];
}

export const resolvers = {
  History__Query: {
    all: async (
      _: undefined,
      args: {
        time: Time.Selection;
        tags: DeepPartial<Tag.Filter>;
      },
      context: Context.Context
    ): Promise<History> => {
      /*
        The default `start` is actually the start of the latest time entry when
        no `start` was provided, but we need to grab a small list of time
        entries to know about the latest time entry
      */
      const time = args.time.start
        ? Time.fromSelection(args.time)
        : Time.stoppedInterval(context.now.subtract(1, "day"));

      const recentEntries = (await Toggl.getEntriesFromTime(time)).getOrElseL(
        Utility.throwError
      );

      // If no time was selected, default to the most recent narrative's time
      const entriesToInclude =
        !args.time.start && recentEntries.length > 0
          ? [recentEntries[0]]
          : recentEntries;

      const narratives = await Promise.all(
        entriesToInclude.map(async entry =>
          (await Narrative.fromTogglEntry(context, entry)).getOrElseL(
            Utility.throwError
          )
        )
      );

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
