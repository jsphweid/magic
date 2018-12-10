import { default as Axios } from "axios";

import * as Result from "./Result";

export const trigger = async (name: string): Promise<Result.Result<void>> => {
  try {
    await Axios.request({
      url: `https://maker.ifttt.com/trigger/${name}/with/key/${
        process.env.IFTTT_KEY
      }`
    });

    return Result.success(void 0);
  } catch (error) {
    // tslint:disable-next-line:no-console
    console.log(error);
    return Result.error(`${error.message} ${error.response.data}`);
  }
};
