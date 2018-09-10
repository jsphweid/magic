import Moment from "moment";
import { either as Either, option as Option } from "fp-ts";

import { Interval, Tag, Score } from "~/time";
import * as Toggl from "~/toggl";

import * as Time from "./Time";
import * as Mutation from "./Mutation";

(Tag as any).fromName = (name: string) =>
  Option.some({
    name,
    connections: [],
    score: Score.nameFromString("NEUTRAL")
  });

// https://github.com/facebook/jest/issues/4262
jest.mock("~/toggl", () => ({
  getProject: jest.fn(),
  getProjects: jest.fn(),

  getTimeEntry: jest.fn(),
  getTimeEntries: jest.fn(),

  getCurrentTimeEntry: jest.fn(),

  createTimeEntry: jest.fn(),
  startTimeEntry: jest.fn(),
  stopTimeEntry: jest.fn(),
  updateTimeEntry: jest.fn(),

  getTags: jest.fn()
}));

const mockToggl: jest.Mocked<typeof Toggl> = Toggl as any;

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

    test("basic", async () => {
      const interval = { start: Moment(), stop: null };
      const newTimeEntry = {
        interval,
        narrative: args.narrative,
        tags: args.tags
      };

      mockTogglConfig({ newTimeEntry, timeEntries: [] });

      await Mutation.resolve.startTime(undefined, { ...args, ...interval });
      expect(mockToggl.createTimeEntry).toEqual(
        mockTimeEntryToTimeSource(newTimeEntry)
      );
    });
  });
});

interface MockTimeEntry {
  interval: Interval.Interval;
  narrative: string;
  tags: string[];
}

const mockTimeEntryToTimeEntry = ({
  interval,
  narrative,
  tags
}: MockTimeEntry): Toggl.TimeEntry => ({
  id: 1,
  billable: false,
  created_with: "magic",
  at: interval.start.toISOString(),
  start: interval.start.toISOString(),
  stop: interval.stop ? interval.stop.toISOString() : undefined,
  duration: Interval.duration(interval).asSeconds(),
  description: narrative,
  tags
});

const mockTimeEntryToTimeSource = ({
  interval,
  narrative,
  tags
}: MockTimeEntry): Time.Source => ({
  interval,
  narratives: [{ id: "1", interval, description: narrative }],
  tagOccurrences: tags.map(name => ({
    id: "1",
    interval,
    tag: {
      id: "1",
      name,
      connections: [],
      score: Score.nameFromString("NEUTRAL")
    }
  }))
});

const mockTogglConfig = (mock: {
  newTimeEntry?: MockTimeEntry;
  timeEntries: MockTimeEntry[];
}) => {
  const newTimeEntry = mock.newTimeEntry
    ? mockTimeEntryToTimeEntry(mock.newTimeEntry)
    : undefined;

  const timeEntries = mock.timeEntries.map(mockTimeEntry =>
    mockTimeEntryToTimeEntry(mockTimeEntry)
  );

  if (newTimeEntry) {
    timeEntries.push(newTimeEntry);
  }

  mockToggl.getTimeEntries.mockResolvedValue(Either.right(timeEntries));

  mockToggl.createTimeEntry.mockResolvedValue(Either.right(newTimeEntry));
  mockToggl.startTimeEntry.mockResolvedValue(Either.right(newTimeEntry));
  mockToggl.updateTimeEntry.mockResolvedValue(Either.right(newTimeEntry));

  mockToggl.getTags.mockResolvedValue(
    Either.right(
      timeEntries.reduce<Toggl.Tag[]>(
        (acc, { tags }) => [
          ...acc,
          ...tags.map(name => ({ id: 1, wid: 1, name }))
        ],
        []
      )
    )
  );
};
