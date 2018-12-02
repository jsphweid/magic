import { option as Option } from "fp-ts";
import _ from "lodash";
import Moment from "moment";

import * as Result from "../Result";
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

// Make it easy to create new entries from a friendly interface

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
  start: Time.DateTime,
  stop: Time.DateTime,
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
          duration: Math.abs(
            Time.stoppedInterval(start, stop)
              .duration()
              .asSeconds()
          )
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
              Time.stoppedInterval(Moment(entry.start), Moment(stop))
                .duration()
                .asSeconds()
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
  start: Time.DateTime,
  stop: Time.DateTime
): Promise<Request.Result<Entry[]>> => {
  // We're limited to 1000 time entries per request
  let entries: Entry[] = [];
  for (const batch of Time.batchesFromInterval(
    Moment.duration(7, "days"),
    Time.stoppedInterval(start, stop)
  )) {
    const result = (await Request.execute<Entry[]>({
      method: "GET",
      resource: "/time_entries",
      params: Option.some({
        start_date: batch.start.toISOString(),
        end_date: batch.stop.toISOString()
      }),
      data: Option.none
    })).map(entriesBatch => (entries = entries.concat(entriesBatch)));
    if (result.isLeft()) return result;
  }

  // Make sure time entries are returned in the order they were started in
  return Result.success(
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
