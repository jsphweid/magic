import { either as Either, option as Option } from "fp-ts";

import _ from "lodash";
import Moment from "moment";

import * as Request from "./Request";
import * as Interval from "../Schema/Interval";

/*
  Time entries are currently the fundemental method of storage. This is slightly
  problematic since they can only contain one narrative at a time whereas Magic
  is intended to record multiples tags *and* narratives. Moving away from Toggl
  will eventually solve this problem
*/

// https://github.com/toggl/toggl_api_docs/blob/master/chapters/time_entries.md

export interface Entry {
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
  pid: Option.Option<number>;
  description: Option.Option<string>;
  tags: Option.Option<string[]>;
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

export const get = async (id: number): Promise<Request.Result<Entry>> =>
  Request.get<Entry>(`/time_entries/${id}`);

export const getInterval = async (
  start: Moment.Moment,
  stop: Moment.Moment
): Promise<Request.Result<Entry[]>> => {
  const batchSizeMS = 7 * 24 * 60 * 60 * 1000; // Seven days

  /*
    We're limited to 1000 time entries per request. To get around this we need
    to grab the results in batches of `batchSizeMS` duration
  */
  let entries: Entry[] = [];
  for (const batchStart of _.range(
    start.valueOf(),
    stop.valueOf(),
    batchSizeMS
  )) {
    const { value: batch } = await Request.get<Entry[]>("/time_entries", {
      start_date: Moment(batchStart).toISOString(),
      end_date: Moment(batchStart)
        .add(batchSizeMS, "ms")
        .toISOString()
    });

    if (batch instanceof Error) {
      return Either.left(batch);
    }

    entries = entries.concat(batch);
  }

  // Make sure time entries are returned in the order they were started in
  return Either.right(
    entries.sort(
      (a, b) =>
        Moment(a.start).valueOf() <= Moment(b.start).valueOf() ? 1 : -1
    )
  );
};

export const getCurrentEntry = async (): Promise<
  Request.Result<Option.Option<Entry>>
> =>
  (await extractData(
    Request.get<DataResponse<Entry>>(`/time_entries/current`)
  )).map(entry => Option.fromNullable(entry));

const newEntryToTogglData = ({
  pid,
  description,
  tags
}: NewEntry): {
  created_with: "HireMeForMoney";
  pid: number | null;
  description: string | null;
  tags: string[] | null;
} => ({
  created_with: "HireMeForMoney",
  pid: pid.toNullable(),
  description: description.toNullable(),
  tags: tags.toNullable()
});

export const post = async (
  start: Moment.Moment,
  stop: Moment.Moment,
  newEntry: NewEntry
): Promise<Request.Result<Entry>> =>
  extractData(
    Request.post<DataResponse<Entry>>(
      `/time_entries`,
      JSON.stringify({
        time_entry: {
          ...newEntryToTogglData(newEntry),
          start: start.toISOString(),
          duration: Interval.duration(start, stop).asSeconds()
        }
      })
    )
  );

export const start = async (
  start: Moment.Moment,
  newEntry: NewEntry
): Promise<Request.Result<Entry>> =>
  extractData(
    Request.post<DataResponse<Entry>>(
      `/time_entries/start`,
      JSON.stringify({
        time_entry: {
          ...newEntryToTogglData(newEntry),
          start: start.toISOString()
        }
      })
    )
  );

export const stop = async (
  ID: number | string
): Promise<Request.Result<Entry>> =>
  extractData(Request.put<DataResponse<Entry>>(`/time_entries/${ID}/stop`));

export const put = async (entry: Entry): Promise<Request.Result<Entry>> =>
  extractData(
    Request.put<{ data: Entry }>(
      `/time_entries/${entry.id}`,
      JSON.stringify({ time_entry: entry })
    )
  );
