import { Either } from "@grapheng/prelude";

import * as Request from "./Request";

export {
  Entry,
  New as NewEntry,
  get as getEntry,
  post as postEntry,
  put as putEntry,
  delete_ as deleteEntry,
  getFromTime as getEntriesFromTime,
  getOngoing as getOngoingEntry,
  start as startEntry,
  stop as stopEntry
} from "./Entry";

/*
  Projects are only really used for basic reporting and the timeline view in the
  Toggl web app
*/

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

export const getProject = async (
  ID: string
): Promise<Either.ErrorOr<Project>> =>
  Request.workspace<Project>(`/projects/${ID}`);

export const getProjects = async (): Promise<Either.ErrorOr<Project[]>> =>
  Request.workspace<Project[]>("/projects");

// https://github.com/toggl/toggl_api_docs/blob/master/chapters/tags.md
export interface Tag {
  id: number;
  wid: number;
  name: string;
}

export const getTags = async (): Promise<Either.ErrorOr<Tag[]>> =>
  Request.workspace<Tag[]>("/tags");
