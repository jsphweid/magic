import * as Entry from "./Entry";
import * as Request from "./Request";

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
  id: string
): Promise<Request.Result<Project>> =>
  Request.workspace<Project>(`/projects/${id}`);

export const getProjects = async (): Promise<Request.Result<Project[]>> =>
  Request.workspace<Project[]>("/projects");

// https://github.com/toggl/toggl_api_docs/blob/master/chapters/tags.md

export interface Tag {
  id: number;
  wid: number;
  name: string;
}

export const getTags = async (): Promise<Request.Result<Tag[]>> =>
  Request.workspace<Tag[]>("/tags");

export { Entry };
