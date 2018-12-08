import { default as Axios } from "axios";

import * as Result from "../Result";

export const workspace = async <Data>(
  resource: string
): Promise<Result.Result<Data>> =>
  execute<Data>({
    method: "GET",
    resource: `/workspaces/${process.env.TOGGL_WORKSPACE_ID}${resource}`
  });

export const execute = async <Data>(config: {
  method: "GET" | "POST" | "PUT" | "DELETE";
  resource: string;
  params?: { [name: string]: string | number };
  data?: string;
}): Promise<Result.Result<Data>> => {
  try {
    const { data }: { data: Data } = await Axios.request({
      url: config.resource.includes(".com")
        ? config.resource
        : `https://www.toggl.com/api/v8${config.resource}`,

      // https://github.com/toggl/toggl_api_docs/blob/master/chapters/users.md#get-current-user-data
      auth: {
        username: `${process.env.TOGGL_TOKEN}`,
        password: "api_token"
      },

      method: config.method,
      params: config.params,
      data: config.data
    });

    return Result.success(data);
  } catch (error) {
    const message = `${error.message} ${error.response.data}`;

    // tslint:disable-next-line:no-console
    console.log(message);
    return Result.error(message);
  }
};
