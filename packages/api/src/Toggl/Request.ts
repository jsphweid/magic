import { Either, Error } from "@grapheng/prelude";
import Axios from "axios";

export const workspace = async <Data>(
  resource: string
): Promise<Either.ErrorOr<Data>> =>
  execute<Data>({
    method: "GET",
    resource: `/workspaces/${process.env.TOGGL_WORKSPACE_ID}${resource}`
  });

export const execute = async <Data>(config: {
  method: "GET" | "POST" | "PUT" | "DELETE";
  resource: string;
  params?: { [name: string]: string };
  data?: any;
}): Promise<Either.ErrorOr<Data>> => {
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
    // tslint:disable-next-line:no-console
    console.log(error);
    return Either.left(Error.from(`${error.message} ${error.response.data}`));
  }
};
