import { AxiosRequestConfig, default as Axios } from "axios";
import { either as Either } from "fp-ts";

export type Result<Data> = Either.Either<Error, Data>;

export const method = <Data>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  resource: string,
  params?: any
): Promise<Result<Data>> => request<Data>({ method, url: resource, params });

export const workspace = async <Data>(
  resource: string
): Promise<Result<Data>> =>
  method<Data>(
    "GET",
    `/workspaces/${process.env.TOGGL_WORKSPACE_ID}/${resource}`
  );

const request = async <Data>(
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
    // tslint:disable-next-line:no-console
    console.log(error);

    return Either.left(new Error(`${error.message}${error.data}`));
  }
};
