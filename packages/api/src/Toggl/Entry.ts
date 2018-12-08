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

interface New {
  pid?: number;
  description?: string;
  tags?: string[];
}

// Required by Toggl
interface CreatedWith {
  created_with: "HireMeForMoney";
}

const entry = ({ pid, description, tags }: New): New & CreatedWith => ({
  pid,
  description,
  tags: tags || [],
  created_with: "HireMeForMoney"
});

/*
  Some of Toggl's responses wrap the result we care about in a "data" field.
  This function helps map the result of the response to the final shape.
*/

interface ResponseWithDataField<Data> {
  data: Data;
}

const extractData = async <Data>(
  response: Promise<Result.Result<ResponseWithDataField<Data>>>
): Promise<Result.Result<Data>> => (await response).map(({ data }) => data);

export const get = async (ID: number): Promise<Result.Result<Entry>> =>
  Request.execute<Entry>({
    method: "GET",
    resource: `/time_entries/${ID}`
  });

export const post = async (
  start: Time.Date,
  stop: Time.Date,
  entry: New
): Promise<Result.Result<Entry>> =>
  extractData(
    Request.execute<ResponseWithDataField<Entry>>({
      method: "POST",
      resource: `/time_entries`,
      data: {
        time_entry: {
          ...entry,
          start: start.toISOString(),
          duration: Time.duration(Time.stoppedInterval(start, stop)).asSeconds()
        }
      }
    })
  );

export const put = async (entry: Entry): Promise<Result.Result<Entry>> =>
  extractData(
    Request.execute<ResponseWithDataField<Entry>>({
      method: "PUT",
      resource: `/time_entries/${entry.id}`,
      data: {
        time_entry: {
          ...entry,
          duration: !entry.stop
            ? entry.duration
            : Time.duration(
                Time.stoppedInterval(Moment(entry.start), Moment(entry.stop))
              )
        }
      }
    })
  );

export const delete_ = async (entry: Entry): Promise<Result.Result<void>> =>
  Request.execute<void>({
    method: "DELETE",
    resource: `/time_entries/${entry.id}`
  });

export const getInterval = async (
  start: Time.Date,
  stop: Time.Date
): Promise<Result.Result<Entry[]>> => {
  // We're limited to 1000 time entries per request
  let entries: Entry[] = [];
  for (const batch of Time.batchesFromInterval(
    Moment.duration(7, "days"),
    Time.stoppedInterval(start, stop)
  )) {
    const result = (await Request.execute<Entry[]>({
      method: "GET",
      resource: "/time_entries",
      params: {
        start_date: batch.start.toISOString(),
        end_date: batch.stop.toISOString()
      }
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
  Result.Result<Option.Option<Entry>>
> =>
  (await extractData(
    Request.execute<ResponseWithDataField<Entry>>({
      method: "GET",
      resource: `/time_entries/current`
    })
  )).map(entry => Option.fromNullable(entry));

export const start = async (entry: New): Promise<Result.Result<Entry>> =>
  extractData(
    Request.execute<ResponseWithDataField<Entry>>({
      method: "POST",
      resource: `/time_entries/start`,
      data: { time_entry: entry }
    })
  );

export const stop = async (entry: Entry): Promise<Result.Result<Entry>> =>
  extractData(
    Request.execute<ResponseWithDataField<Entry>>({
      method: "PUT",
      resource: `/time_entries/${entry.id}/stop`
    })
  );
