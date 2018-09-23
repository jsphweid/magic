import { option as Option } from "fp-ts";

import Moment from "moment";

import * as Utility from "../../Utility";
import * as Toggl from "../../Toggl";
import * as MockToggl from "../../Toggl/index.mock";
import * as Mutation from "../Mutation";

jest.mock("../../../.data/tags.json", () =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => ({ name: `tag-${number}` }))
);

// Ensure tests can refer to the exact same start time
(Moment as any).now = () => MockToggl.state.now.valueOf();

const entryFromArgs = (args: Mutation.Args): Toggl.Entry.Entry => {
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
  describe("setTime", () => {
    const defaultArgs = {
      start: null,
      stop: null,
      narrative: "This is the new entry",
      tags: ["tag-1", "tag-2"]
    };

    describe("Start time now", () => {
      test(MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED, async () => {
        MockToggl.setState(MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED);

        const newEntry = entryFromArgs(defaultArgs);

        await Mutation.resolve.setTime(undefined, defaultArgs);
        expect(MockToggl.state).toEqual({
          ...MockToggl.state,
          currentEntry: Option.some(newEntry),
          entries: [newEntry]
        });
      });

      test(MockToggl.StatePreset.CURRENT_ENTRY_STARTED, async () => {
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
      });
    });

    describe("Start time in the recent past", () => {
      const args = {
        ...defaultArgs,
        start: Moment().subtract(30, "minutes")
      };

      test(MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED, async () => {
        MockToggl.setState(MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED);

        const newEntry = entryFromArgs(args);

        await Mutation.resolve.setTime(undefined, args);
        expect(MockToggl.state).toEqual({
          ...MockToggl.state,
          currentEntry: Option.some(newEntry),
          entries: [newEntry]
        });
      });

      test(MockToggl.StatePreset.CURRENT_ENTRY_STARTED, async () => {
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
      });
    });

    describe("Start time in the distant past", () => {
      const args = {
        ...defaultArgs,
        start: Moment().subtract(2.5, "hours")
      };

      test(MockToggl.StatePreset.SEVERAL_RECENT_ENTRIES, async () => {
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
      });
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
          ${MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED}
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
          ...it should be split in two with the new entry between the parts
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
                stop: args.start.toISOString(),
                duration: 35 * 60
              }
            ]
          });
        }
      );
    });
  });
});

// test("Start the current entry in the future", async () => {
// });

// test("Create an entry from some `start` and `stop`", async () => {
// });
