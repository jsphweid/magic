import { option as Option } from "fp-ts";
import Moment from "moment";

import * as Toggl from "../../Toggl";
import * as MockToggl from "../../Toggl/index.mock";
import * as Utility from "../../Utility";
import * as Mutation from "../Mutation";
import * as Time from "../Time";

jest.mock("../../../.data/tags.json", () => [
  { name: "tag-without-connections" },
  { name: "tag-with-a-connection", connections: ["tag-without-connections"] },
  {
    name: "tag-with-connections",
    connections: ["tag-without-connections", "tag-with-a-connection"]
  }
]);

// Ensure tests can refer to the exact same start time
(Moment as any).now = () => MockToggl.state.now.valueOf();

const entryFromArgs = (args: {
  start: Time.Date | null;
  stop: Time.Date | null;
  narrative: string | null;
  tags: string[] | null;
}): Toggl.Entry.Entry => {
  const entry = MockToggl.entry(
    Option.fromNullable(args.start).getOrElse(MockToggl.state.now),
    Option.fromNullable(args.stop),
    {
      pid: Option.none,
      description: Option.fromNullable(args.narrative),
      tags: Option.fromNullable(args.tags)
    }
  );

  /*
    Undo the effect on the state since we're just creating entries for
    comparisons
  */
  --MockToggl.state.nextNewEntryID;

  return entry;
};

describe("Mutation", () => {
  const defaultArgs = {
    start: null,
    stop: null,
    narrative: "This is the new entry",
    tags: ["tag-without-connections", "tag-with-a-connection"]
  };

  describe("setTime", () => {
    describe("Start time now", () => {
      test(
        Utility.trim`
          ${MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED}
          ...the current entry is set to the new entry
        `,
        async () => {
          MockToggl.setState(MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED);

          const newEntry = entryFromArgs(defaultArgs);

          await Mutation.resolve.setTime(undefined, defaultArgs);
          expect(MockToggl.state).toEqual({
            ...MockToggl.state,
            currentEntry: Option.some(newEntry),
            entries: [newEntry]
          });
        }
      );

      test(
        Utility.trim`
          ${MockToggl.StatePreset.CURRENT_ENTRY_STARTED}
          ...the current entry is stopped and replaced by the new entry
        `,
        async () => {
          MockToggl.setState(MockToggl.StatePreset.CURRENT_ENTRY_STARTED);

          const newEntry = entryFromArgs(defaultArgs);

          await Mutation.resolve.setTime(undefined, defaultArgs);
          expect(MockToggl.state).toEqual({
            ...MockToggl.state,
            currentEntry: Option.some(newEntry),
            entries: [
              newEntry,
              {
                ...MockToggl.ENTRIES[0],
                stop: Moment().toISOString()
              }
            ]
          });
        }
      );
    });

    describe("Start time in the recent past", () => {
      const args = {
        ...defaultArgs,
        start: Moment().subtract(30, "minutes")
      };

      test(
        Utility.trim`
          ${MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED}
          ...the entry is created with a start date in the past and is the new
          current entry
        `,
        async () => {
          MockToggl.setState(MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED);

          const newEntry = entryFromArgs(args);

          await Mutation.resolve.setTime(undefined, args);
          expect(MockToggl.state).toEqual({
            ...MockToggl.state,
            currentEntry: Option.some(newEntry),
            entries: [newEntry]
          });
        }
      );

      test(
        Utility.trim`
          ${MockToggl.StatePreset.CURRENT_ENTRY_STARTED}
          ...the entry which intersects with the new entry is trimmed
        `,
        async () => {
          MockToggl.setState(MockToggl.StatePreset.CURRENT_ENTRY_STARTED);

          const newEntry = entryFromArgs(args);

          await Mutation.resolve.setTime(undefined, args);
          expect(MockToggl.state).toEqual({
            ...MockToggl.state,
            currentEntry: Option.some(newEntry),
            entries: [
              newEntry,
              {
                ...MockToggl.ENTRIES[0],
                stop: args.start.toISOString()
              }
            ]
          });
        }
      );
    });

    describe("Start time in the distant past", () => {
      const args = {
        ...defaultArgs,
        start: Moment().subtract(2.5, "hours")
      };

      test(
        Utility.trim`
          ${MockToggl.StatePreset.SEVERAL_RECENT_ENTRIES}
          ...entries which are completely overlapped by the new entry are
          deleted and the partial intersections get trimmed out
        `,
        async () => {
          MockToggl.setState(MockToggl.StatePreset.SEVERAL_RECENT_ENTRIES);

          const newEntry = entryFromArgs(args);

          await Mutation.resolve.setTime(undefined, args);
          expect(MockToggl.state).toEqual({
            ...MockToggl.state,
            currentEntry: Option.some(newEntry),
            entries: [
              newEntry,
              {
                ...MockToggl.ENTRIES[2],
                stop: args.start.toISOString()
              },
              MockToggl.ENTRIES[3]
            ]
          });
        }
      );
    });

    describe("Start time in the future", () => {
      const args = {
        ...defaultArgs,
        start: Moment().add(30, "minutes")
      };

      test(
        Utility.trim`
          ${MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED}
          ...the new entry becomes the current entry
        `,
        async () => {
          MockToggl.setState(MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED);

          const newEntry = entryFromArgs(args);

          await Mutation.resolve.setTime(undefined, args);
          expect(MockToggl.state).toEqual({
            ...MockToggl.state,
            currentEntry: Option.some(newEntry),
            entries: [newEntry]
          });
        }
      );

      test(
        Utility.trim`
          ${MockToggl.StatePreset.CURRENT_ENTRY_STARTED}
          ...the new entry becomes the current entry and the old current entry
          is stopped where the new one starts
        `,
        async () => {
          MockToggl.setState(MockToggl.StatePreset.CURRENT_ENTRY_STARTED);

          const newEntry = entryFromArgs(args);

          await Mutation.resolve.setTime(undefined, args);
          expect(MockToggl.state).toEqual({
            ...MockToggl.state,
            currentEntry: Option.some(newEntry),
            entries: [
              newEntry,
              {
                ...MockToggl.ENTRIES[0],
                stop: args.start.toISOString()
              }
            ]
          });
        }
      );

      test(
        Utility.trim`
          ${MockToggl.StatePreset.SEVERAL_RECENT_ENTRIES}
          ...the new entry becomes the current entry and the old current entry
          is stopped where the new one starts
        `,
        async () => {
          MockToggl.setState(MockToggl.StatePreset.SEVERAL_RECENT_ENTRIES);

          const newEntry = entryFromArgs(args);

          await Mutation.resolve.setTime(undefined, args);
          expect(MockToggl.state).toEqual({
            ...MockToggl.state,
            currentEntry: Option.some(newEntry),
            entries: [
              newEntry,
              {
                ...MockToggl.ENTRIES[0],
                stop: args.start.toISOString()
              },
              MockToggl.ENTRIES[1],
              MockToggl.ENTRIES[2],
              MockToggl.ENTRIES[3]
            ]
          });
        }
      );
    });

    describe("Set time which isn't ongoing", () => {
      test(
        Utility.trim`
          ${MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED}
          ...the new entry should be added without becoming the current entry
        `,
        async () => {
          MockToggl.setState(MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED);

          const args = {
            ...defaultArgs,
            start: Moment().subtract(2.5, "hour"),
            stop: Moment().subtract(15, "minutes")
          };

          const entry = entryFromArgs(args);

          await Mutation.resolve.setTime(undefined, args);
          expect(MockToggl.state).toEqual({
            ...MockToggl.state,
            currentEntry: Option.none,
            entries: [entry]
          });
        }
      );

      test(
        Utility.trim`
          ${MockToggl.StatePreset.CURRENT_ENTRY_STARTED}
          ...the current entry should be split in two with the new entry between
          the parts
        `,
        async () => {
          MockToggl.setState(MockToggl.StatePreset.CURRENT_ENTRY_STARTED);

          const args = {
            ...defaultArgs,
            start: Moment().subtract(25, "minutes"),
            stop: Moment().subtract(15, "minutes")
          };

          const entry = entryFromArgs(args);

          await Mutation.resolve.setTime(undefined, args);

          expect(MockToggl.state).toEqual({
            ...MockToggl.state,
            currentEntry: Option.some({
              ...MockToggl.ENTRIES[0],
              start: args.stop.toISOString()
            }),
            entries: [
              {
                ...MockToggl.ENTRIES[0],
                start: args.stop.toISOString()
              },
              entry,
              {
                ...MockToggl.ENTRIES[0],
                id: 2,
                stop: args.start.toISOString()
              }
            ]
          });
        }
      );
    });
  });
});
