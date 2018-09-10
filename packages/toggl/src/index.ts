import _ from "lodash";
import Moment from "moment";

import { default as Axios, AxiosRequestConfig } from "axios";
import { either as Either, option as Option } from "fp-ts";

import * as Time from "~/time";

type Result<Data> = Either.Either<Error, Data>;

// https://github.com/toggl/toggl_api_docs/blob/master/chapters/projects.md

export interface Project {
  id: number;
  wid: number;
  cid?: number;
  name: string;
  active?: boolean;
  is_private?: boolean;
  template?: boolean;
  template_id?: number;
  billable?: boolean;
  auto_estimates?: number;
  color?: string;
  rate?: number;
  at?: string;
}

export const getProject = async (id: string): Promise<Result<Project>> =>
  workspace<Project>(`/projects/${id}`);

export const getProjects = async (): Promise<Result<Project[]>> =>
  workspace<Project[]>("/projects");

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

export const getTimeEntry = async (id: string): Promise<Result<TimeEntry>> =>
  get<TimeEntry>(`/time_entries/${id}`);

export const getTimeEntries = async (
  interval: Time.Interval.Interval
): Promise<Result<TimeEntry[]>> => {
  const { start, stop } = Time.Interval.toStopped(interval);

  // seven days
  const batchSizeMS = 7 * 24 * 60 * 60 * 1000;

  let timeEntries: TimeEntry[] = [];
  for (const batchStart of _.range(
    start.valueOf(),
    stop.valueOf(),
    batchSizeMS
  )) {
    const batch = await get<TimeEntry[]>("/time_entries", {
      start_date: Moment(batchStart).toISOString(),
      end_date: Moment(batchStart)
        .add(batchSizeMS, "ms")
        .toISOString()
    });

    if (batch.isLeft()) {
      return batch;
    }

    timeEntries = [...timeEntries, ...batch.value];
  }

  return Either.right(
    timeEntries.sort(
      (a, b) =>
        Moment(a.start).valueOf() <= Moment(b.start).valueOf() ? 1 : -1
    )
  );
};

export const getCurrentTimeEntry = async (): Promise<
  Result<Option.Option<TimeEntry>>
> => {
  const response = await get<{ data: TimeEntry }>(`/time_entries/current`);
  return response.isLeft()
    ? Either.left(response.value)
    : Either.right(Option.fromNullable(response.value.data));
};

export interface NewTimeEntry {
  projectID?: number;
  description?: string;
  tags?: string[];
}

export const createTimeEntry = async (
  newTimeEntry: NewTimeEntry & { interval: Time.Interval.Stopped }
): Promise<Result<TimeEntry>> => {
  const response = await post<{ data: TimeEntry }>(
    `/time_entries`,
    JSON.stringify({
      time_entry: {
        ...newTimeEntryToBodyData(newTimeEntry),
        duration: Time.Interval.duration(newTimeEntry.interval).asSeconds(),
        start: newTimeEntry.interval.start.toISOString()
      }
    })
  );

  return response.isLeft()
    ? Either.left(response.value)
    : Either.right(response.value.data);
};

export const startTimeEntry = async (
  newTimeEntry: NewTimeEntry
): Promise<Result<TimeEntry>> => {
  const response = await post<{ data: TimeEntry }>(
    `/time_entries/start`,
    JSON.stringify({ time_entry: newTimeEntryToBodyData(newTimeEntry) })
  );

  return response.isLeft()
    ? Either.left(response.value)
    : Either.right(response.value.data);
};

const newTimeEntryToBodyData = ({
  projectID,
  description,
  tags
}: NewTimeEntry): {
  created_with: "magic";
  pid?: number;
  description?: string;
  tags: string[];
} => ({
  created_with: "magic",
  pid: projectID,
  description,
  tags: tags || []
});

export const stopTimeEntry = async (
  id: number | string
): Promise<Result<void>> => put<void>(`/time_entries/${id}/stop`);

export const updateTimeEntry = async (
  timeEntry: TimeEntry
): Promise<Result<TimeEntry>> => {
  const response = await put<{ data: TimeEntry }>(
    `/time_entries/${timeEntry.id}`,
    JSON.stringify({ time_entry: timeEntry })
  );

  return response.isLeft()
    ? Either.left(response.value)
    : Either.right(response.value.data);
};

// https://github.com/toggl/toggl_api_docs/blob/master/chapters/tags.md

export interface Tag {
  id: number;
  wid: number;
  name: string;
}

export const getTags = async (): Promise<Result<Tag[]>> =>
  workspace<Tag[]>("/tags");

const togglRequest = async <Data>(
  config: AxiosRequestConfig
): Promise<Result<Data>> => {
  const url = `https://www.toggl.com/api/v8${config.url}`;

  // https://github.com/toggl/toggl_api_docs/blob/master/chapters/users.md#get-current-user-data

  const auth = {
    username: `${process.env.TOGGL_TOKEN}`,
    password: "api_token"
  };

  try {
    const { data } = await Axios.request({ ...config, url, auth });
    return Either.right(data as Data);
  } catch (error) {
    const formattedError = JSON.stringify({ error, message: error.data });
    console.log(formattedError);

    return Either.left(new Error(formattedError));
  }
};

const get = <Data>(resource: string, params?: any): Promise<Result<Data>> =>
  togglRequest<Data>({
    method: "get",
    url: resource,
    params
  });

const post = <Data>(resource: string, data?: string): Promise<Result<Data>> =>
  togglRequest<Data>({
    headers: { "Content-Type": "application/json" },
    method: "post",
    url: resource,
    data
  });

const put = <Data>(resource: string, data?: string): Promise<Result<Data>> =>
  togglRequest<Data>({
    headers: { "Content-Type": "application/json" },
    method: "put",
    url: resource,
    data
  });

const workspace = async <Data>(resource: string): Promise<Result<Data>> =>
  get<Data>(`/workspaces/${process.env.TOGGL_WORKSPACE_ID}/${resource}`);
