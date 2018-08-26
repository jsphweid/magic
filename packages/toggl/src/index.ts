import Moment from "moment";

import { default as Axios, AxiosRequestConfig } from "axios";

import * as Time from "~/time";

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

export const getProject = async (id: string): Promise<Project> =>
  workspace(`/projects/${id}`);

export const getProjects = async (): Promise<Project[]> =>
  workspace("/projects");

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

export const getTimeEntry = async (id: string): Promise<TimeEntry> =>
  get(`/time_entries/${id}`);

export const getTimeEntries = async (
  interval: Time.Interval.Interval
): Promise<TimeEntry[]> => {
  const { start, stop } = Time.Interval.toStopped(interval);

  const params = {
    start_date: start.toISOString(),
    end_date: stop.toISOString()
  };

  const timeEntries: TimeEntry[] = await get("/time_entries", params);
  return timeEntries.sort((a, b) => Moment(a.start).diff(Moment(b.start)));
};

export const startTimeEntry = async (timeEntry: {
  project?: Project;
  description: string;
  tags?: string[];
}): Promise<void> =>
  post(
    `/time_entries/start`,
    JSON.stringify({
      time_entry: {
        created_with: "magic",
        pid: (timeEntry.project && timeEntry.project.id) || null,
        description: timeEntry.description,
        tags: timeEntry.tags || []
      }
    })
  );

// https://github.com/toggl/toggl_api_docs/blob/master/chapters/tags.md

export interface Tag {
  id: string;
  wid: number;
  name: string;
  at: string;
}

export const getTags = async (): Promise<Tag[]> => workspace("/tags");

const togglRequest = async (config: AxiosRequestConfig) => {
  const url = `https://www.toggl.com/api/v8${config.url}`;

  // https://github.com/toggl/toggl_api_docs/blob/master/chapters/users.md#get-current-user-data

  const auth = {
    username: `${process.env.TOGGL_TOKEN}`,
    password: "api_token"
  };

  try {
    const { data } = await Axios.request({ ...config, url, auth });

    return data;
  } catch (e) {
    console.log(e);
  }
};

const get = (resource: string, params?: any) =>
  togglRequest({ url: resource, method: "get", params });

const post = (resource: string, data: string) =>
  togglRequest({
    url: resource,
    method: "post",
    headers: { "Content-Type": "application/json" },
    data
  });

const workspace = async (resource: string) =>
  get(`/workspaces/${process.env.TOGGL_WORKSPACE_ID}/${resource}`);
