import Moment from "moment";

import { default as Axios, AxiosRequestConfig } from "axios";

// https://github.com/toggl/toggl_api_docs/blob/master/chapters/projects.md

import * as Time from "~/time";

export interface Secrets {
  token: string;
  workspaceId: string;
}

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

export const getProject = async (
  secrets: Secrets,
  id: string
): Promise<Project> => workspace(secrets, `/projects/${id}`);

export const getProjects = async (secrets: Secrets): Promise<Project[]> =>
  workspace(secrets, "/projects");

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

export const getTimeEntry = async (
  secrets: Secrets,
  id: string
): Promise<TimeEntry> => get(secrets, `/time_entries/${id}`);

export const getTimeEntries = async (
  secrets: Secrets,
  interval: Time.Interval.Interval
): Promise<TimeEntry[]> => {
  const { start, stop } = Time.Interval.end(interval);

  const params = {
    start_date: start.toISOString(),
    end_date: stop.toISOString()
  };

  const timeEntries: TimeEntry[] = await get(secrets, "/time_entries", params);
  return timeEntries.sort((a, b) => Moment(a.start).diff(Moment(b.start)));
};

export const startTimeEntry = async (
  secrets: Secrets,
  timeEntry: {
    project?: Project;
    description: string;
    tags?: string[];
  }
): Promise<void> =>
  post(
    secrets,
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

export const getTags = async (secrets: Secrets): Promise<Tag[]> =>
  workspace(secrets, "/tags");

const togglRequest = async (secrets: Secrets, config: AxiosRequestConfig) => {
  const url = `https://www.toggl.com/api/v8${config.url}`;

  // https://github.com/toggl/toggl_api_docs/blob/master/chapters/users.md#get-current-user-data
  const auth = {
    username: `${secrets.token}`,
    password: "api_token"
  };

  const { data } = await Axios.request({ ...config, url, auth });

  return data;
};

const get = (secrets: Secrets, resource: string, params?: any) =>
  togglRequest(secrets, { url: resource, method: "get", params });

const post = (secrets: Secrets, resource: string, data: string) =>
  togglRequest(secrets, {
    url: resource,
    method: "post",
    headers: { "Content-Type": "application/json" },
    data
  });

const workspace = async (secrets: Secrets, resource: string) =>
  get(secrets, `/workspaces/${secrets.workspaceId}${resource}`);
