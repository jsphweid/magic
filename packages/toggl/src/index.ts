import { default as Axios } from "axios";
import moment from "moment";

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
  togglWorkspaceRequest(`/projects/${id}`);

export const getProjects = async (): Promise<Project[]> =>
  togglWorkspaceRequest("/projects");

// https://github.com/toggl/toggl_api_docs/blob/master/chapters/time_entries.md

export interface TimeEntry {
  description?: string;
  id?: number;
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
  togglRequest(`/time_entries/${id}`);

export const getTimeEntries = async (): Promise<TimeEntry[]> => {
  const from = moment().subtract(30, "days");
  const to = moment();

  const timeEntries = (await togglRequest("/time_entries", {
    start_date: from.toISOString(),
    end_date: to.toISOString()
  })) as TimeEntry[];

  return timeEntries.sort((a, b) => moment(a.start).diff(moment(b.start)));
};

// https://github.com/toggl/toggl_api_docs/blob/master/chapters/tags.md

export interface Tag {
  id: string;
  wid: number;
  name: string;
  at: string;
}

export const getTags = async (): Promise<Tag[]> =>
  togglWorkspaceRequest("/tags");

const togglWorkspaceRequest = async (resource: string) =>
  togglRequest(`/workspaces/${process.env.TOGGL_WORKSPACE}/${resource}`);

const togglRequest = async (
  resource: string,
  params?: { [name: string]: any }
) => {
  const url = `https://www.toggl.com/api/v8${resource}`;

  // https://github.com/toggl/toggl_api_docs/blob/master/chapters/users.md#get-current-user-data
  const auth = {
    username: `${process.env.TOGGL_TOKEN}`,
    password: "api_token"
  };

  const { data } = await Axios.get(url, { auth, params });

  return data;
};
