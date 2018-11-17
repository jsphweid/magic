import { either as Either, option as Option } from "fp-ts";
import _ from "lodash";
import Moment from "moment";

import * as Time from "../Schema/Time";
import * as Request from "./Request";

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
  tags?: string[];
  duronly?: boolean;
  at: string;
}

// Make it easy to create entries from a friendly interface

export interface NewEntry {
  pid: Option.Option<number>;
  description: Option.Option<string>;
  tags: string[];
}

const newEntryToTogglData = (
  newEntry: NewEntry
): {
  created_with: "HireMeForMoney";
  pid?: number;
  description?: string;
  tags?: string[];
} => ({
  created_with: "HireMeForMoney",
  pid: newEntry.pid.toUndefined(),
  description: newEntry.description.toUndefined(),
  tags: newEntry.tags
});

/*
  Some of Toggl's responses wrap the result we care about in a "data" field.
  This function helps map the result of the response to the final shape.
*/

interface DataResponse<Data> {
  data: Data;
}

const extractData = async <Data>(
  response: Promise<Request.Result<DataResponse<Data>>>
): Promise<Request.Result<Data>> => (await response).map(({ data }) => data);

// Standard HTTP verbs

export const GET = async (ID: number): Promise<Request.Result<Entry>> =>
  Request.execute<Entry>({
    method: "GET",
    resource: `/time_entries/${ID}`,
    params: Option.none,
    data: Option.none
  });

export const POST = async (
  start: Time.Date,
  stop: Time.Date,
  newEntry: NewEntry
): Promise<Request.Result<Entry>> =>
  extractData(
    Request.execute<DataResponse<Entry>>({
      method: "POST",
      resource: `/time_entries`,
      params: Option.none,
      data: Option.some({
        time_entry: {
          ...newEntryToTogglData(newEntry),
          start: start.toISOString(),
          duration: Math.abs(Time.durationFromDates(start, stop).asSeconds())
        }
      })
    })
  );

export const PUT = async (entry: Entry): Promise<Request.Result<Entry>> => {
  return extractData(
    Request.execute<DataResponse<Entry>>({
      method: "PUT",
      resource: `/time_entries/${entry.id}`,
      params: Option.none,
      data: Option.some({
        time_entry: {
          ...entry,
          duration: Option.fromNullable(entry.stop).fold(entry.duration, stop =>
            Math.abs(
              Time.durationFromDates(
                Moment(entry.start),
                Moment(stop)
              ).asSeconds()
            )
          )
        }
      })
    })
  );
};
export const DELETE = async (entry: Entry): Promise<Request.Result<void>> =>
  Request.execute<void>({
    method: "DELETE",
    resource: `/time_entries/${entry.id}`,
    params: Option.none,
    data: Option.none
  });

// Non standard API actions

export const getInterval = async (
  start: Time.Date,
  stop: Time.Date
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
    const { value: batch } = await Request.execute<Entry[]>({
      method: "GET",
      resource: "/time_entries",
      params: Option.some({
        start_date: Moment(batchStart).toISOString(),
        end_date: Moment(batchStart)
          .add(batchSizeMS, "ms")
          .toISOString()
      }),
      data: Option.none
    });

    if (batch instanceof Error) {
      return Either.left(batch);
    }
    entries = entries.concat(batch);
  }

  // Make sure time entries are returned in the order they were started in
  return Either.right(
    entries.sort((a, b) =>
      Moment(a.start).valueOf() <= Moment(b.start).valueOf() ? 1 : -1
    )
  );
};

export const getCurrentEntry = async (): Promise<
  Request.Result<Option.Option<Entry>>
> =>
  (await extractData(
    Request.execute<DataResponse<Entry>>({
      method: "GET",
      resource: `/time_entries/current`,
      params: Option.none,
      data: Option.none
    })
  )).map(entry => Option.fromNullable(entry));

export const start = async (
  newEntry: NewEntry
): Promise<Request.Result<Entry>> =>
  extractData(
    Request.execute<DataResponse<Entry>>({
      method: "POST",
      resource: `/time_entries/start`,
      params: Option.none,
      data: Option.some({
        time_entry: newEntryToTogglData(newEntry)
      })
    })
  );

export const stop = async (entry: Entry): Promise<Request.Result<Entry>> =>
  extractData(
    Request.execute<DataResponse<Entry>>({
      method: "PUT",
      resource: `/time_entries/${entry.id}/stop`,
      params: Option.none,
      data: Option.none
    })
  );
