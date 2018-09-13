import _ from "lodash";
import Moment from "moment";

import { either as Either, option as Option } from "fp-ts";

import { Interval } from "~/time";

import * as Request from "./Request";

/*
  Time entries are currently the fundemental method of storage. This is slightly
  problematic since they can only contain one narrative at a time whereas Magic
  is intended to record multiples tags *and* narratives. Moving away from Toggl
  will eventually solve this problem
*/

// https://github.com/toggl/toggl_api_docs/blob/master/chapters/time_entries.md

export interface TimeEntry {
  description?: string;
  id: number;
  pid?: number;
  wid?: number;
  tid?: number;
  billable: boolean;
  start: string;
  stop?: string;
  duration: number;
  created_with: string;
  tags: string[];
  duronly?: boolean;
  at: string;
}

export interface NewEntry {
  pid?: number;
  description?: string;
  tags?: string[];
}

interface DataResponse<Data> {
  data: Data;
}

/*
  Some of Toggl's responses wrap the result we care about in a "data" field.
  This function helps map the result of the response to the final shape.
*/

const extractData = async <Data>(
  response: Promise<Request.Result<DataResponse<Data>>>
): Promise<Request.Result<Data>> => (await response).map(({ data }) => data);

export const get = async (id: number): Promise<Request.Result<TimeEntry>> =>
  Request.get<TimeEntry>(`/time_entries/${id}`);

export const getInterval = async (
  interval: Interval.Interval
): Promise<Request.Result<TimeEntry[]>> => {
  const { start, stop } = Interval.toStopped(interval);
  const batchSizeMS = 7 * 24 * 60 * 60 * 1000; // Seven days

  /*
    We're limited to 1000 time entries per request. To get around this we need
    to grab the results in batches of `batchSizeMS` duration
  */
  let timeEntries: TimeEntry[] = [];
  for (const batchStart of _.range(
    start.valueOf(),
    stop.valueOf(),
    batchSizeMS
  )) {
    const { value: batch } = await Request.get<TimeEntry[]>("/time_entries", {
      start_date: Moment(batchStart).toISOString(),
      end_date: Moment(batchStart)
        .add(batchSizeMS, "ms")
        .toISOString()
    });

    if (batch instanceof Error) {
      return Either.left(batch);
    }

    timeEntries = timeEntries.concat(batch);
  }

  // Make sure time entries are returned in the order they were started in
  return Either.right(
    timeEntries.sort(
      (a, b) =>
        Moment(a.start).valueOf() <= Moment(b.start).valueOf() ? 1 : -1
    )
  );
};

export const getCurrentTimeEntry = async (): Promise<
  Request.Result<Option.Option<TimeEntry>>
> =>
  (await extractData(
    Request.get<DataResponse<TimeEntry>>(`/time_entries/current`)
  )).map(timeEntry => Option.fromNullable(timeEntry));

const newEntryToTogglData = (
  newEntry: NewEntry
): NewEntry & {
  created_with: "HireMeForMoney";
} => ({ ...newEntry, created_with: "HireMeForMoney" });

export const post = async (
  interval: Interval.Stopped,
  newEntry: NewEntry
): Promise<Request.Result<TimeEntry>> =>
  extractData(
    Request.post<DataResponse<TimeEntry>>(
      `/time_entries`,
      JSON.stringify({
        time_entry: {
          ...newEntryToTogglData(newEntry),
          start: interval.start.toISOString(),
          duration: Interval.duration(interval).asSeconds()
        }
      })
    )
  );

export const start = async (
  newTimeEntry: NewEntry
): Promise<Request.Result<TimeEntry>> =>
  extractData(
    Request.post<DataResponse<TimeEntry>>(
      `/time_entries/start`,
      JSON.stringify({
        time_entry: newEntryToTogglData(newTimeEntry)
      })
    )
  );

export const stop = async (
  id: number | string
): Promise<Request.Result<TimeEntry>> =>
  extractData(Request.put<DataResponse<TimeEntry>>(`/time_entries/${id}/stop`));

export const put = async (
  timeEntry: TimeEntry
): Promise<Request.Result<TimeEntry>> =>
  extractData(
    Request.put<{ data: TimeEntry }>(
      `/time_entries/${timeEntry.id}`,
      JSON.stringify({ time_entry: timeEntry })
    )
  );
