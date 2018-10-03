import { default as Axios } from "axios";
import { either as Either, option as Option } from "fp-ts";

export type Result<Data> = Either.Either<Error, Data>;

export const workspace = async <Data>(
  resource: string
): Promise<Result<Data>> =>
  execute<Data>({
    method: "GET",
    resource: `/workspaces/${process.env.TOGGL_WORKSPACE_ID}${resource}`,
    params: Option.none,
    data: Option.none
  });

export const execute = async <Data>(config: {
  method: "GET" | "POST" | "PUT" | "DELETE";
  resource: string;
  params: Option.Option<any>;
  data: Option.Option<any>;
}): Promise<Result<Data>> => {
  try {
    const { data } = await Axios.request({
      url: `https://www.toggl.com/api/v8${config.resource}`,

      // https://github.com/toggl/toggl_api_docs/blob/master/chapters/users.md#get-current-user-data
      auth: {
        username: `${process.env.TOGGL_TOKEN}`,
        password: "api_token"
      },
      method: config.method,
      params: config.params.toUndefined(),
      data: config.data.toUndefined()
    });

    return Either.right(data as Data);
  } catch (error) {
    const formattedError = new Error(`${error.message} ${error.response.data}`);

    // tslint:disable-next-line:no-console
    console.log(formattedError);
    return Either.left(formattedError);
  }
};
