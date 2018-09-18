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

beforeEach(() => (togglState.now = Moment()));

describe("Mutation", () => {
  describe("startTime", () => {
    const defaultArgs = {
      start: null,
      stop: null,
      narrative: "This is the new narrative",
      tags: ["tag-1", "tag-2"]
    };

    describe("No current entry or existing entries", () => {
      describe("Start the current entry starting now", () => {
        const entry = mockEntryFromArgs(defaultArgs);

        test("When nothing has recently been tracked", async () => {
          togglState = {
            ...togglState,
            currentEntry: Option.none,
            entries: []
          };

          await Mutation.resolve.startTime(undefined, defaultArgs);

          expect(togglState).toEqual({
            ...togglState,
            currentEntry: Option.some(entry),
            entries: [entry]
          });
        });

        test("When an entry is already started as the current entry", async () => {
          const oldEntry = mockEntry(
            {
              start: Option.some(Moment().subtract(1, "hour")),
              stop: Option.none
            },
            {
              pid: Option.none,
              description: Option.some("This entry is currently running"),
              tags: Option.some(["tag-3", "tag-4"])
            }
          );

          togglState = {
            ...togglState,
            currentEntry: Option.some(oldEntry),
            entries: [oldEntry]
          };
        });
      });

      test("Start the current entry in the past", async () => {
        const args = { ...defaultArgs, start: Moment().subtract(2, "minutes") };
        const entry = mockEntryFromArgs(args);

        await Mutation.resolve.startTime(undefined, args);

        expect(togglState).toEqual({
          ...togglState,
          currentEntry: Option.some(entry),
          entries: [entry]
        });
      });

      test("Start the current entry in the future", async () => {
        const args = { ...defaultArgs, start: Moment().add(2, "minutes") };
        const entry = mockEntryFromArgs(args);

        await Mutation.resolve.startTime(undefined, args);

        expect(togglState).toEqual({
          ...togglState,
          currentEntry: Option.some(entry),
          entries: [entry]
        });
      });

      test("Create an entry from some `start` and `stop`", async () => {
        const args = {
          ...defaultArgs,
          start: Moment().subtract(3, "minutes"),
          stop: Moment().add(3, "minutes")
        };

        const entry = mockEntryFromArgs(args);

        await Mutation.resolve.startTime(undefined, args);

        expect(togglState).toEqual({
          ...togglState,
          entries: [entry]
        });
      });
    });
  });
});

// The following mocks enable us to emulate a stateful Toggl API

let togglState: {
  now: Moment.Moment;
  currentEntry: Option.Option<Toggl.Entry.Entry>;
  entries: Toggl.Entry.Entry[];
};

const mockEntry = (
  interval: {
    start: Option.Option<Moment.Moment>;
    stop: Option.Option<Moment.Moment>;
  },
  newEntry: Toggl.Entry.NewEntry
): Toggl.Entry.Entry => {
  const start = interval.start.getOrElse(togglState.now);

  return {
    id: 1,
    billable: false,
    created_with: "HireMeForMoney",

    at: start.toISOString(),
    start: start.toISOString(),
    stop: interval.stop.map(stop => stop.toISOString()).toUndefined(),

    duration: Interval.resolve
      .duration({
        start,
        stop: interval.stop.getOrElse(togglState.now)
      })
      .asSeconds(),

    description: newEntry.description.toUndefined(),
    tags: newEntry.tags.getOrElse([])
  };
};

const mockEntryFromArgs = (args: Mutation.Args): Toggl.Entry.Entry =>
  mockEntry(
    {
      start: Option.fromNullable(args.start),
      stop: Option.fromNullable(args.stop)
    },
    {
      pid: Option.none,
      description: Option.fromNullable(args.narrative),
      tags: Option.fromNullable(args.tags)
    }
  );

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
    togglState.entries.push(
      mockEntry(
        {
          start: Option.some(start),
          stop: Option.some(stop)
        },
        newEntry
      )
    );

    return Promise.resolve(Either.right(togglState.entries[0]));
  }
);

mockToggl.Entry.put.mockImplementation(async (entry: Toggl.Entry.Entry) =>
  Promise.resolve(
    Option.fromNullable(togglState.entries.find(({ id }) => id === entry.id))
      .map(oldEntry => (oldEntry = entry))
      .toUndefined()
  )
);

mockToggl.Entry.start.mockImplementation(
  async (
    start: Option.Option<Moment.Moment>,
    newEntry: Toggl.Entry.NewEntry
  ) => {
    const entry = mockEntry({ start, stop: Option.none }, newEntry);

    togglState.currentEntry = Option.some(entry);
    togglState.entries.push(entry);

    return Promise.resolve(Either.right(entry));
  }
);

mockToggl.Entry.stop.mockImplementation(async (ID: number | string) =>
  Option.fromNullable(togglState.entries.find(({ id }) => id === ID)).map(
    entry => {
      togglState.currentEntry.map(
        () => (togglState.currentEntry = Option.none)
      );

      entry.duration = Interval.resolve
        .duration({
          start: Moment(entry.start),
          stop: togglState.now
        })
        .asSeconds();

      togglState.entries.push(entry);

      return Promise.resolve(Either.right(entry));
    }
  )
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
