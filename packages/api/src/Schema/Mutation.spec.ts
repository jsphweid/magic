import { either as Either, option as Option } from "fp-ts";

import Moment from "moment";

import * as Toggl from "../Toggl";
import * as Interval from "./Interval";
import * as Mutation from "./Mutation";

jest.mock("../../.data/tags.json", () =>
  [1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => ({ name: `tag-${number}` }))
);

// https://github.com/facebook/jest/issues/4262
jest.mock("../Toggl", () => ({
  Entry: {
    get: jest.fn(),
    getInterval: jest.fn(),

    post: jest.fn(),
    put: jest.fn(),

    start: jest.fn(),
    stop: jest.fn()
  },

  getProject: jest.fn(),
  getProjects: jest.fn(),
  getTags: jest.fn()
}));

const mockToggl: jest.Mocked<typeof Toggl> & {
  Entry: jest.Mocked<typeof Toggl.Entry>;
} = Toggl as any;

interface TogglState {
  now: Moment.Moment;
  currentEntry: Option.Option<Toggl.Entry.Entry>;
  entries: Toggl.Entry.Entry[];
}

let togglState: TogglState = {
  now: Moment(),
  currentEntry: Option.none,
  entries: []
};

Moment.now = () => togglState.now.valueOf();

const mockEntry = (
  start: Moment.Moment,
  stop: Option.Option<Moment.Moment>,
  newEntry: Toggl.Entry.NewEntry
): Toggl.Entry.Entry => ({
  id: 1,
  billable: false,
  created_with: "HireMeForMoney",

  at: start.toISOString(),
  start: start.toISOString(),
  stop: stop.map(stop => stop.toISOString()).toUndefined(),
  duration: Interval.duration(
    start,
    stop.getOrElse(togglState.now)
  ).asSeconds(),

  description: newEntry.description.toUndefined(),
  tags: newEntry.tags.getOrElse([])
});

const MOCK_ENTRIES = [
  mockEntry(Moment(togglState.now).subtract(1, "hour"), Option.none, {
    pid: Option.none,
    description: Option.some("This entry is currently running"),
    tags: Option.some(["tag-3", "tag-4"])
  })
];

enum TogglStatePreset {
  NOTHING_HAS_BEEN_TRACKED = "When nothing has recently been tracked",
  CURRENT_ENTRY_ALREADY_STARTED = "When the current entry is already started "
}

const togglStates: { [Preset in TogglStatePreset]: TogglState } = {
  [TogglStatePreset.NOTHING_HAS_BEEN_TRACKED]: {
    ...togglState,
    currentEntry: Option.none,
    entries: []
  },
  [TogglStatePreset.CURRENT_ENTRY_ALREADY_STARTED]: {
    ...togglState,
    currentEntry: Option.some(MOCK_ENTRIES[0]),
    entries: [MOCK_ENTRIES[0]]
  }
};

const mockEntryFromArgs = (args: Mutation.Args): Toggl.Entry.Entry =>
  mockEntry(
    Option.fromNullable(args.start).getOrElse(togglState.now),
    Option.fromNullable(args.stop),
    {
      pid: Option.none,
      description: Option.fromNullable(args.narrative),
      tags: Option.fromNullable(args.tags)
    }
  );

describe("Mutation", () => {
  describe("startTime", () => {
    const defaultArgs = {
      start: null,
      stop: null,
      narrative: "This is the new entry",
      tags: ["tag-1", "tag-2"]
    };

    describe("Start the current entry now", () => {
      const entry = mockEntryFromArgs(defaultArgs);

      test(TogglStatePreset.NOTHING_HAS_BEEN_TRACKED, async () => {
        togglState = {
          ...togglState,
          ...togglStates[TogglStatePreset.NOTHING_HAS_BEEN_TRACKED]
        };

        await Mutation.resolve.startTime(undefined, defaultArgs);
        expect(togglState).toEqual({
          ...togglState,
          currentEntry: Option.some(entry),
          entries: [entry]
        });
      });

      test(TogglStatePreset.CURRENT_ENTRY_ALREADY_STARTED, async () => {
        togglState = {
          ...togglState,
          ...togglStates[TogglStatePreset.CURRENT_ENTRY_ALREADY_STARTED]
        };

        const oldEntry =
          togglStates[TogglStatePreset.CURRENT_ENTRY_ALREADY_STARTED]
            .entries[0];

        console.log(togglState);

        await Mutation.resolve.startTime(undefined, defaultArgs);

        console.log(togglState);

        expect(togglState).toEqual({
          ...togglState,
          currentEntry: Option.some(entry),
          entries: [entry, oldEntry]
        });
      });
    });

    // describe("Start the current entry in the past", () => {
    //   const args = { ...defaultArgs, start: Moment().subtract(5, "minutes") };
    //   const entry = mockEntryFromArgs(args);

    //   test(TogglStatePreset.NOTHING_HAS_BEEN_TRACKED, async () => {
    //     togglState = {
    //       ...togglState,
    //       ...togglStates[TogglStatePreset.NOTHING_HAS_BEEN_TRACKED]
    //     };

    //     await Mutation.resolve.startTime(undefined, args);
    //     expect(togglState).toEqual({
    //       ...togglState,
    //       currentEntry: Option.some(entry),
    //       entries: [entry]
    //     });
    //   });

    //   test(TogglStatePreset.CURRENT_ENTRY_ALREADY_STARTED, async () => {
    //     togglState = {
    //       ...togglState,
    //       ...togglStates[TogglStatePreset.CURRENT_ENTRY_ALREADY_STARTED]
    //     };

    //     const oldEntry =
    //       togglStates[TogglStatePreset.CURRENT_ENTRY_ALREADY_STARTED]
    //         .entries[0];

    //     const oldEntryWithUpdatedStop = {
    //       ...oldEntry,
    //       stop: args.start.toISOString()
    //     };

    //     await Mutation.resolve.startTime(undefined, args);
    //     expect(togglState).toEqual({
    //       ...togglState,
    //       currentEntry: Option.some(entry),
    //       entries: [oldEntryWithUpdatedStop, entry]
    //     });
    //   });
    // });
  });
});

// test("Start the current entry in the future", async () => {
//   const args = { ...defaultArgs, start: Moment().add(2, "minutes") };
//   const entry = mockEntryFromArgs(args);

//   await Mutation.resolve.startTime(undefined, args);

//   expect(togglState).toEqual({
//     ...togglState,
//     currentEntry: Option.some(entry),
//     entries: [entry]
//   });
// });

// test("Create an entry from some `start` and `stop`", async () => {
//   const args = {
//     ...defaultArgs,
//     start: Moment().subtract(3, "minutes"),
//     stop: Moment().add(3, "minutes")
//   };

//   const entry = mockEntryFromArgs(args);

//   await Mutation.resolve.startTime(undefined, args);

//   expect(togglState).toEqual({
//     ...togglState,
//     entries: [entry]
//   });
// });

// The following mocks enable us to emulate a stateful Toggl API

mockToggl.Entry.get.mockResolvedValue(async () =>
  Promise.resolve(Either.right(togglState.entries))
);

mockToggl.Entry.getInterval.mockImplementation(async () =>
  Promise.resolve(Either.right(togglState.entries))
);

mockToggl.Entry.post.mockImplementation(
  async (
    start: Moment.Moment,
    stop: Moment.Moment,
    newEntry: Toggl.Entry.NewEntry
  ) => {
    const entry = mockEntry(start, Option.some(stop), newEntry);
    togglState = { ...togglState, entries: [entry, ...togglState.entries] };
    return Promise.resolve(Either.right(entry));
  }
);

mockToggl.Entry.put.mockImplementation(async (entry: Toggl.Entry.Entry) => {
  const currentEntry = togglState.currentEntry.map(
    currentEntry =>
      currentEntry.description === entry.description
        ? { ...currentEntry, ...entry }
        : currentEntry
  );

  const entries = togglState.entries.map(
    oldEntry =>
      oldEntry.description === entry.description
        ? { ...oldEntry, ...entry }
        : oldEntry
  );

  togglState = { ...togglState, currentEntry, entries };
  return Promise.resolve(Either.right(entry));
});

mockToggl.Entry.start.mockImplementation(
  async (start: Moment.Moment, newEntry: Toggl.Entry.NewEntry) => {
    const entry = mockEntry(start, Option.none, newEntry);
    const currentEntry = Option.some(entry);
    const entries = [entry, ...togglState.entries];
    togglState = { ...togglState, currentEntry, entries };
    return Promise.resolve(Either.right(entry));
  }
);

mockToggl.Entry.stop.mockImplementation(async () =>
  togglState.currentEntry.map(currentEntry => {
    const stoppedCurrentEntry = {
      ...currentEntry,
      stop: togglState.now.toISOString(),
      duration: Interval.duration(
        Moment(currentEntry.start),
        togglState.now
      ).asSeconds()
    };

    const entries = togglState.entries.map(
      entry =>
        entry.description === currentEntry.description
          ? stoppedCurrentEntry
          : entry
    );

    togglState = { ...togglState, currentEntry: Option.none, entries };
    return Promise.resolve(Either.right(stoppedCurrentEntry));
  })
);

mockToggl.getProjects.mockResolvedValue(Either.right([]));

mockToggl.getTags.mockImplementation(async () =>
  Promise.resolve(
    Either.right(
      togglState.entries.reduce<Toggl.Tag[]>(
        (previous, { tags }) => [
          ...previous,
          ...tags.map(name => ({ id: 1, wid: 1, name }))
        ],
        []
      )
    )
  )
);
