import { Either } from "@grapheng/prelude";

import * as English from "./english";
import * as Time from "./time";

export const parse = (source: string): Either.ErrorOr<Time.Duration> =>
  English.toDuration(source);
