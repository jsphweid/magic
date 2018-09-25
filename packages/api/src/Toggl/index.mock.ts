import { either as Either, option as Option } from "fp-ts";
import Moment from "moment";

import * as Interval from "../Schema/Interval";
import * as Toggl from "./index";

// Enable mocking of the `Toggl` module in other spec files

// https://github.com/facebook/jest/issues/4262
jest.mock("./index", () => ({
  Entry: {
    GET: jest.fn(),
    POST: jest.fn(),
    PUT: jest.fn(),
    DELETE: jest.fn(),

    getInterval: jest.fn(),
    getCurrentEntry: jest.fn(),

    start: jest.fn(),
    stop: jest.fn()
  },

  getProject: jest.fn(),
  getProjects: jest.fn(),
  getTags: jest.fn()
}));

type MockToggl = jest.Mocked<typeof Toggl> & {
  Entry: jest.Mocked<typeof Toggl.Entry>;
};

const MockToggl: MockToggl = Toggl as any;

/*
  The following code helps emulate a stateful Toggl API so we can test the
  outcomes of mutations using declarative comparisons of the `state` object
*/

interface State {
  now: Moment.Moment;
  nextNewEntryID: number;
  currentEntry: Option.Option<Toggl.Entry.Entry>;
  entries: Toggl.Entry.Entry[];
}

export let state: State = {
  now: Moment(),
  nextNewEntryID: 0,
  currentEntry: Option.none,
  entries: []
};

// Ensure tests can refer to the exact same start time
(Moment as any).now = () => state.now.valueOf();

// Construct mock entries from the arguments we normally pass into Toggl
export const entry = (
  start: Moment.Moment,
  stop: Option.Option<Moment.Moment>,
  newEntry: Toggl.Entry.NewEntry
): Toggl.Entry.Entry => ({
  id: ++state.nextNewEntryID - 1,
  billable: false,
  created_with: "HireMeForMoney",

  at: start.toISOString(),
  start: start.toISOString(),
  stop: stop.map(stop => stop.toISOString()).toUndefined(),
  duration: Interval.duration(start, stop.getOrElse(state.now)).asSeconds(),

  description: newEntry.description.toUndefined(),
  tags: newEntry.tags.getOrElse([])
});

/*
  Static mock entries for creating preset states...

  |  -4hr        |  -3hr        |  -2hr        |  -1hr        | Now
  |  ENTRIES[3]  |  ENTRIES[2]  |  ENTRIES[1]  |  ENTRIES[0]  |
*/
export const ENTRIES = [
  {
    description: "Doing a cool thing",
    tags: ["tag-without-connections", "tag-with-a-connection"]
  },
  {
    description: "Look more things",
    tags: ["tag-with-a-connection"]
  },
  {
    description: "Doing nothing",
    tags: []
  },
  {
    description: "Doing everything!",
    tags: ["tag-with-connections"]
  }
].map(({ description, tags }, index) =>
  entry(
    Moment(state.now).subtract(index + 1, "hour"),
    index === 0
      ? Option.none
      : Option.some(Moment(state.now).subtract(index, "hour")),
    {
      pid: Option.none,
      description: Option.some(description),
      tags: Option.some(tags)
    }
  )
);

// These represent common Toggl API states
export enum StatePreset {
  NOTHING_RECENTLY_TRACKED = "When nothing has recently been tracked",
  CURRENT_ENTRY_STARTED = "When the current entry has already started",
  SEVERAL_RECENT_ENTRIES = "When several entries have recently been tracked"
}

export const states: { [Preset in StatePreset]: State } = {
  [StatePreset.NOTHING_RECENTLY_TRACKED]: {
    ...state,
    nextNewEntryID: 0,
    currentEntry: Option.none,
    entries: []
  },

  [StatePreset.CURRENT_ENTRY_STARTED]: {
    ...state,
    nextNewEntryID: 1,
    currentEntry: Option.some(ENTRIES[0]),
    entries: [ENTRIES[0]]
  },

  [StatePreset.SEVERAL_RECENT_ENTRIES]: {
    ...state,
    nextNewEntryID: ENTRIES.length,
    currentEntry: Option.some(ENTRIES[0]),
    entries: ENTRIES
  }
};

// Allow users of this mock to set the state using the presets
export const setState = (statePreset: StatePreset) =>
  (state = { ...state, ...states[statePreset] });

/*
  Actually mock the implementation of the `Toggl` client's methods using this
  module's state object
*/

MockToggl.Entry.GET.mockResolvedValue(async () => Either.right(state.entries));

MockToggl.Entry.POST.mockImplementation(
  async (
    start: Moment.Moment,
    stop: Moment.Moment,
    newEntry: Toggl.Entry.NewEntry
  ) => {
    const entries = sortEntries([
      entry(start, Option.some(stop), newEntry),
      ...state.entries
    ]);

    state = { ...state, entries };
    return Either.right(state.entries[0]);
  }
);

MockToggl.Entry.PUT.mockImplementation(async (entry: Toggl.Entry.Entry) => {
  // If the entry is the current entry, update it
  const currentEntry = state.currentEntry.map(
    currentEntry =>
      currentEntry.id === entry.id
        ? { ...currentEntry, ...entry }
        : currentEntry
  );

  // Update the entry in the list of all entries
  const entries = sortEntries(
    state.entries.map(
      oldEntry =>
        oldEntry.id === entry.id ? { ...oldEntry, ...entry } : oldEntry
    )
  );

  state = { ...state, currentEntry, entries };
  return Either.right(entry);
});

MockToggl.Entry.DELETE.mockImplementation(async (entry: Toggl.Entry.Entry) => {
  // If the entry is the current entry, unset it
  const currentEntry = state.currentEntry.chain(
    currentEntry =>
      currentEntry.id !== entry.id ? Option.some(currentEntry) : Option.none
  );

  // Remove the entry from the list of entries
  const entries = state.entries.filter(({ id }) => id !== entry.id);

  state = { ...state, currentEntry, entries };
  return Either.right(entry);
});

MockToggl.Entry.DELETE.mockImplementation(async (entry: Toggl.Entry.Entry) => {
  // If the entry is the current entry, update it
  const currentEntry = state.currentEntry.map(
    currentEntry =>
      currentEntry.id === entry.id
        ? { ...currentEntry, ...entry }
        : currentEntry
  );

  // Update the entry in the list of all entries
  const entries = state.entries.filter(oldEntry => oldEntry.id !== entry.id);

  state = { ...state, currentEntry, entries };
  return Promise.resolve(Either.right(entry));
});

MockToggl.Entry.getInterval.mockImplementation(async () =>
  Either.right(state.entries)
);

MockToggl.Entry.getCurrentEntry.mockImplementation(async () =>
  Either.right(state.currentEntry)
);

MockToggl.Entry.start.mockImplementation(
  async (start: Moment.Moment, newEntry: Toggl.Entry.NewEntry) => {
    const currentEntry = entry(start, Option.none, newEntry);
    const entries = sortEntries([currentEntry, ...state.entries]);

    state = { ...state, currentEntry: Option.some(currentEntry), entries };
    return Either.right(entries[0]);
  }
);

MockToggl.Entry.stop.mockImplementation(async () =>
  // Only stop the current entry if it exists
  state.currentEntry.map(currentEntry => {
    // Stop the current entry now and update its duration
    const stoppedCurrentEntry = {
      ...currentEntry,
      stop: state.now.toISOString(),
      duration: Interval.duration(
        Moment(currentEntry.start),
        state.now
      ).asSeconds()
    };

    // Update the entry with its new timing information
    const entries = state.entries.map(
      entry => (entry.id === currentEntry.id ? stoppedCurrentEntry : entry)
    );

    // Clear out the current entry
    state = { ...state, currentEntry: Option.none, entries };
    return Either.right(stoppedCurrentEntry);
  })
);

// Just pretend there are no projects
MockToggl.getProjects.mockResolvedValue(Either.right([]));

// The tags which exist are the ones we can find in the state
MockToggl.getTags.mockImplementation(async () =>
  Either.right(
    state.entries.reduce<Toggl.Tag[]>(
      (previous, { tags }) => [
        ...previous,
        ...tags.map(name => ({ id: 1, wid: 1, name }))
      ],
      []
    )
  )
);

const sortEntries = (entries: Toggl.Entry.Entry[]): Toggl.Entry.Entry[] =>
  entries.sort(
    (a, b) => (Moment(a.start).valueOf() <= Moment(b.start).valueOf() ? 1 : -1)
  );
