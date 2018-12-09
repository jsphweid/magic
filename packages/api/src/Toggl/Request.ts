import { default as Axios } from "axios";
import { either as Either } from "fp-ts";

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
  params?: { [name: string]: string };
  data?: any;
}): Promise<Result.Result<Data>> => {
  try {
    const { data } = await Axios.request<Data>({
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

    return Either.right(data);
  } catch (error) {
    const formattedError = new Error(`${error.message} ${error.response.data}`);

    // tslint:disable-next-line:no-console
    console.log(formattedError);
    return Either.left(formattedError);
  }
};
