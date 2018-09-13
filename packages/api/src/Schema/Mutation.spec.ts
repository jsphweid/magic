import Moment from "moment";
import { either as Either, option as Option } from "fp-ts";

import { Interval, Tag, Score } from "~/time";
import * as Toggl from "~/toggl";

import * as Mutation from "./Mutation";

(Tag as any).fromName = (name: string) =>
  Option.some({
    name,
    connections: [],
    score: Score.nameFromString("NEUTRAL")
  });

// https://github.com/facebook/jest/issues/4262
jest.mock("~/toggl", () => ({
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
      const { currentTimeEntry } = mockTogglAPI();
      await Mutation.resolve.startTime(undefined, args);
      expect(currentTimeEntry).toEqual(
        mockTimeEntry(
          { start: Moment(), stop: null },
          {
            description: args.narrative,
            tags: args.tags
          }
        )
      );
    });
  });
});

const mockTimeEntry = (
  interval: Interval.Interval,
  newEntry: Toggl.TimeEntry.NewEntry
): Toggl.TimeEntry.TimeEntry => ({
  id: 1,
  billable: false,
  created_with: "HireMeForMoney",
  at: interval.start.toISOString(),
  start: interval.start.toISOString(),
  stop: interval.stop ? interval.stop.toISOString() : undefined,
  duration: Interval.duration(interval).asSeconds(),
  description: newEntry.description,
  tags: newEntry.tags || []
});

// const mockTimeSource = ({
//   interval,
//   narrative,
//   tags
// }: MockTimeEntry): Time.Source => ({
//   interval,
//   narratives: [{ id: "1", interval, description: narrative }],
//   tagOccurrences: tags.map(name => ({
//     id: "1",
//     interval,
//     tag: {
//       id: "1",
//       name,
//       connections: [],
//       score: Score.nameFromString("NEUTRAL")
//     }
//   }))
// });

interface TogglState {
  currentTimeEntry?: Toggl.TimeEntry.TimeEntry;
  timeEntries: Toggl.TimeEntry.TimeEntry[];
}

/*
  Creates a stateful mock Toggl API which behaves as if real reads and writes
  are occuring
*/
const mockTogglAPI = (state: TogglState): TogglState => {
  mockToggl.TimeEntry.get.mockResolvedValue(Either.right(state.timeEntries));
  mockToggl.TimeEntry.getInterval.mockResolvedValue(
    Either.right(state.timeEntries)
  );

  mockToggl.TimeEntry.post.mockImplementation(
    async (interval: Interval.Interval, newEntry: Toggl.TimeEntry.NewEntry) => {
      const timeEntry = mockTimeEntry(interval, newEntry);

      if (!state.timeEntries) {
        state.timeEntries = [];
      }

      state.timeEntries.push(timeEntry);
      return Promise.resolve(Either.right(timeEntry));
    }
  );

  // mockToggl.TimeEntry.put.mockResolvedValue(Either.right(newTimeEntry));

  mockToggl.TimeEntry.start.mockResolvedValue(
    async (interval: Interval.Interval, newEntry: Toggl.TimeEntry.NewEntry) => {
      const timeEntry = mockTimeEntry(interval, newEntry);

      if (!state.timeEntries) {
        state.timeEntries = [];
      }

      if (state.currentTimeEntry) {
        state.timeEntries.push(state.currentTimeEntry);
      }

      state.currentTimeEntry = timeEntry;
      state.timeEntries.push(timeEntry);
      return Promise.resolve(Either.right(timeEntry));
    }
  );

  // mockToggl.TimeEntry.stop.mockResolvedValue(Either.right(newTimeEntry));

  mockToggl.getProjects.mockResolvedValue(Either.right([]));

  mockToggl.getTags.mockResolvedValue(
    Either.right(
      (state.timeEntries || []).reduce<Toggl.Tag[]>(
        (previous, { tags }) => [
          ...previous,
          ...tags.map(name => ({ id: 1, wid: 1, name }))
        ],
        []
      )
    )
  );

  return {
    currentTimeEntry: state.currentTimeEntry,
    timeEntries: state.timeEntries
  };
};
