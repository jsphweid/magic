import { Either, pipe } from "@grapheng/prelude";
import { option as Option } from "fp-ts";
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

export interface New {
  pid?: number;
  description?: string;
  tags?: string[];
}

// Required by Toggl
const withRequiredField = (entry: {}) => ({
  created_with: "HireMeForMoney",
  ...entry
});

/*
  Some of Toggl's responses wrap the result we care about in a "data" field.
  This function helps map the result of the response to the final shape.
*/

interface DataInField<Data> {
  data: Data;
}

const extractData = async <Data>(
  response: Promise<Either.ErrorOr<DataInField<Data>>>
): Promise<Either.ErrorOr<Data>> =>
  pipe(
    await response,
    Either.map(({ data }) => data)
  );
// (await response).map(({ data }) => data);

export const get = async (ID: number): Promise<Either.ErrorOr<Entry>> =>
  Request.execute<Entry>({
    method: "GET",
    resource: `/time_entries/${ID}`
  });

export const post = async (
  start: Time.Date,
  stop: Time.Date,
  entry: New
): Promise<Either.ErrorOr<Entry>> =>
  extractData(
    Request.execute<DataInField<Entry>>({
      method: "POST",
      resource: "/time_entries",
      data: {
        time_entry: withRequiredField({
          ...entry,
          start: start.toISOString(),
          duration: Time.duration(Time.stoppedInterval(start, stop))
            .abs()
            .asSeconds()
        })
      }
    })
  );

export const put = async (entry: Entry): Promise<Either.ErrorOr<Entry>> =>
  extractData(
    Request.execute<DataInField<Entry>>({
      method: "PUT",
      resource: `/time_entries/${entry.id}`,
      data: {
        time_entry: withRequiredField({
          ...entry,
          duration: !entry.stop
            ? entry.duration
            : Time.duration(
                Time.stoppedInterval(Moment(entry.start), Moment(entry.stop))
              )
                .abs()
                .asSeconds()
        })
      }
    })
  );

export const delete_ = async (entry: Entry): Promise<Either.ErrorOr<void>> =>
  Request.execute<void>({
    method: "DELETE",
    resource: `/time_entries/${entry.id}`
  });

export const getFromTime = async (
  time: Time.Time
): Promise<Either.ErrorOr<Entry[]>> => {
  // We're limited to 1000 time entries per request
  let entries: Entry[] = [];
  for (const batch of Time.batchesFromInterval(
    Moment.duration(7, "days"),
    Time.toStoppedInterval(time)
  )) {
    const result = pipe(
      await Request.execute<Entry[]>({
        method: "GET",
        resource: "/time_entries",
        params: {
          start_date: batch.start.toISOString(),
          end_date: batch.stop.toISOString()
        }
      }),
      Either.map(entriesBatch => (entries = entries.concat(entriesBatch)))
    );

    if (
      pipe(
        result,
        Either.isLeft
      )
    ) {
      return result;
    }
  }

  // Make sure time entries are returned in the order they were started in
  return Either.right(
    entries.sort((a, b) =>
      Moment(a.start).valueOf() <= Moment(b.start).valueOf() ? 1 : -1
    )
  );
};

export const getOngoing = async (): Promise<
  Either.ErrorOr<Option.Option<Entry>>
> =>
  pipe(
    await extractData(
      Request.execute<DataInField<Entry>>({
        method: "GET",
        resource: "/time_entries/current"
      })
    ),
    Either.map(entry => Option.fromNullable(entry))
  );

export const start = async (entry: New): Promise<Either.ErrorOr<Entry>> =>
  extractData(
    Request.execute<DataInField<Entry>>({
      method: "POST",
      resource: `/time_entries/start`,
      data: { time_entry: withRequiredField(entry) }
    })
  );

export const stop = async (entry: Entry): Promise<Either.ErrorOr<Entry>> =>
  extractData(
    Request.execute<DataInField<Entry>>({
      method: "PUT",
      resource: `/time_entries/${entry.id}/stop`
    })
  );
