import { option as Option } from "fp-ts";

import Moment from "moment";

import * as Toggl from "../../Toggl";
import * as MockToggl from "../../Toggl/index.mock";
import * as Mutation from "../Mutation";

jest.mock("../../../.data/tags.json", () =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => ({ name: `tag-${number}` }))
);

// Ensure tests can refer to the exact same start time
(Moment as any).now = () => MockToggl.state.now.valueOf();

const mockEntryFromArgs = (args: Mutation.Args): Toggl.Entry.Entry =>
  MockToggl.entry(
    Option.fromNullable(args.start).getOrElse(MockToggl.state.now),
    Option.fromNullable(args.stop),
    {
      pid: Option.none,
      description: Option.fromNullable(args.narrative),
      tags: Option.fromNullable(args.tags)
    }
  );

describe("Mutation", () => {
  describe("setTime", () => {
    const defaultArgs = {
      start: null,
      stop: null,
      narrative: "This is the new entry",
      tags: ["tag-1", "tag-2"]
    };

    describe("Start time now", () => {
      const entry = mockEntryFromArgs(defaultArgs);

      test(MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED, async () => {
        MockToggl.setState(MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED);
        await Mutation.resolve.setTime(undefined, defaultArgs);
        expect(MockToggl.state).toEqual({
          ...MockToggl.state,
          currentEntry: Option.some(entry),
          entries: [entry]
        });
      });

      test(MockToggl.StatePreset.CURRENT_ENTRY_STARTED, async () => {
        MockToggl.setState(MockToggl.StatePreset.CURRENT_ENTRY_STARTED);
        await Mutation.resolve.setTime(undefined, defaultArgs);
        expect(MockToggl.state).toEqual({
          ...MockToggl.state,
          currentEntry: Option.some(entry),
          entries: [
            entry,
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

      const entry = mockEntryFromArgs(args);

      test(MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED, async () => {
        MockToggl.setState(MockToggl.StatePreset.NOTHING_RECENTLY_TRACKED);
        await Mutation.resolve.setTime(undefined, args);
        expect(MockToggl.state).toEqual({
          ...MockToggl.state,
          currentEntry: Option.some(entry),
          entries: [entry]
        });
      });

      test(MockToggl.StatePreset.CURRENT_ENTRY_STARTED, async () => {
        MockToggl.setState(MockToggl.StatePreset.CURRENT_ENTRY_STARTED);
        await Mutation.resolve.setTime(undefined, args);
        expect(MockToggl.state).toEqual({
          ...MockToggl.state,
          currentEntry: Option.some(entry),
          entries: [
            entry,
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

      const entry = mockEntryFromArgs(args);

      test(MockToggl.StatePreset.SEVERAL_RECENT_ENTRIES, async () => {
        MockToggl.setState(MockToggl.StatePreset.SEVERAL_RECENT_ENTRIES);
        await Mutation.resolve.setTime(undefined, args);
        expect(MockToggl.state).toEqual({
          ...MockToggl.state,
          currentEntry: Option.some(entry),
          entries: [
            entry,
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
      // TODO
    });

    describe("Set time which isn't ongoing", () => {
      // TODO
    });
  });
});

// test("Start the current entry in the future", async () => {
// });

// test("Create an entry from some `start` and `stop`", async () => {
// });
