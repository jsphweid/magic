import { either as Either, option as Option } from "fp-ts";

import Moment from "moment";

import * as Toggl from "../Toggl";
import * as Interval from "./Interval";
import * as Mutation from "./Mutation";

// https://github.com/facebook/jest/issues/4262
jest.mock("../Toggl", () => ({
  TimeEntry: {
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
  TimeEntry: jest.Mocked<typeof Toggl.TimeEntry>;
} = Toggl as any;

beforeEach(() => {
  jest.resetAllMocks();
});

describe("Mutation", () => {
  describe("startTime", () => {
    const args = {
      start: null,
      stop: null,
      narrative: "narrative",
      tags: ["tag-1", "tag-2"]
    };

    test("no time entries running or near the new entry", async () => {
      const { currentTimeEntry } = mockTogglAPI({
        timeEntries: []
      });

      await Mutation.resolve.startTime(undefined, args);

      expect(currentTimeEntry).toEqual(
        mockTimeEntry(Moment(), null, {
          description: args.narrative,
          tags: args.tags
        })
      );
    });
  });
});

const mockTimeEntry = (
  start: Moment.Moment,
  stop: Moment.Moment | null,
  newEntry: Toggl.TimeEntry.NewEntry
): Toggl.TimeEntry.TimeEntry => ({
  id: 1,
  billable: false,
  created_with: "HireMeForMoney",
  at: start.toISOString(),
  start: start.toISOString(),
  stop: stop ? stop.toISOString() : undefined,
  duration: Interval.resolve.duration({ start, stop }).asSeconds(),
  description: newEntry.description,
  tags: newEntry.tags || []
});

/*
  Creates a stateful mock Toggl API which behaves as if real reads and writes
  are occuring
*/

interface TogglState {
  currentTimeEntry?: Toggl.TimeEntry.TimeEntry;
  timeEntries: Toggl.TimeEntry.TimeEntry[];
}

const mockTogglAPI = (state: TogglState): TogglState => {
  mockToggl.TimeEntry.get.mockResolvedValue(async () =>
    Promise.resolve(Either.right(state.timeEntries))
  );

  mockToggl.TimeEntry.getInterval.mockImplementation(async () =>
    Promise.resolve(Either.right(state.timeEntries))
  );

  mockToggl.TimeEntry.post.mockImplementation(
    async (
      start: Moment.Moment,
      stop: Moment.Moment,
      newEntry: Toggl.TimeEntry.NewEntry
    ) => {
      const timeEntry = mockTimeEntry(start, stop, newEntry);
      state.timeEntries.push(timeEntry);
      return Promise.resolve(Either.right(timeEntry));
    }
  );

  mockToggl.TimeEntry.put.mockImplementation(
    async (updatedTimeEntry: Toggl.TimeEntry.TimeEntry) => {
      Option.fromNullable(
        state.timeEntries.find(({ id }) => id === updatedTimeEntry.id)
      ).map(timeEntry => (timeEntry = updatedTimeEntry));

      return Promise.resolve(updatedTimeEntry);
    }
  );

  mockToggl.TimeEntry.start.mockImplementation(
    async (
      start: Moment.Moment,
      stop: Moment.Moment,
      newEntry: Toggl.TimeEntry.NewEntry
    ) => {
      const timeEntry = mockTimeEntry(start, stop, newEntry);

      if (state.currentTimeEntry) {
        state.timeEntries.push(state.currentTimeEntry);
      }

      state.currentTimeEntry = timeEntry;
      state.timeEntries.push(timeEntry);
      return Promise.resolve(Either.right(timeEntry));
    }
  );

  mockToggl.TimeEntry.stop.mockImplementation(async (ID: number | string) =>
    Option.fromNullable(state.timeEntries.find(({ id }) => id === ID)).map(
      timeEntry => {
        Option.fromNullable(state.currentTimeEntry).map(currentTimeEntry => {
          if (currentTimeEntry.id === timeEntry.id) {
            delete state.currentTimeEntry;
          }
        });

        timeEntry.duration = 20;
        state.timeEntries.push(timeEntry);
        return Promise.resolve(Either.right(timeEntry));
      }
    )
  );

  mockToggl.getProjects.mockResolvedValue(Either.right([]));

  mockToggl.getTags.mockImplementation(async () =>
    Promise.resolve(
      Either.right(
        state.timeEntries.reduce<Toggl.Tag[]>(
          (previous, { tags }) => [
            ...previous,
            ...tags.map(name => ({ id: 1, wid: 1, name }))
          ],
          []
        )
      )
    )
  );

  return state;
};
