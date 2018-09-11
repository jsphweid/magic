import { default as Axios, AxiosRequestConfig } from "axios";

import { either as Either } from "fp-ts";

export type Result<Data> = Either.Either<Error, Data>;

export const get = <Data>(
  resource: string,
  params?: any
): Promise<Result<Data>> =>
  request<Data>({
    method: "get",
    url: resource,
    params
  });

export const post = <Data>(
  resource: string,
  data?: string
): Promise<Result<Data>> =>
  request<Data>({
    headers: { "Content-Type": "application/json" },
    method: "post",
    url: resource,
    data
  });

export const put = <Data>(
  resource: string,
  data?: string
): Promise<Result<Data>> =>
  request<Data>({
    headers: { "Content-Type": "application/json" },
    method: "put",
    url: resource,
    data
  });

export const workspace = async <Data>(
  resource: string
): Promise<Result<Data>> =>
  get<Data>(`/workspaces/${process.env.TOGGL_WORKSPACE_ID}/${resource}`);

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
