import { option as Option } from "fp-ts";

import * as Functions from "firebase-functions";

import * as Utility from "./Utility";

const REQUIRED_ENVIRONMENT_VARIABLES = [
  "TIME_ZONE",
  "API_TOKEN",
  "TOGGL_TOKEN",
  "TOGGL_WORKSPACE_ID",
  "TWILIO_NUMBERS_OWNER"
];

if (process.env.NODE_ENV === "production") {
  const config = Functions.config();
  process.env = {
    ...process.env,
    TIME_ZONE: config.time.zone,
    API_TOKEN: config.api.token,
    TOGGL_TOKEN: config.toggl.token,
    TOGGL_WORKSPACE_ID: config.toggl.workspace_id,
    TWILIO_NUMBERS_OWNER: config.twilio.numbers.owner
  };
}

if (!__dirname.includes("functions")) {
  REQUIRED_ENVIRONMENT_VARIABLES.forEach(variableName =>
    Option.fromNullable(process.env[variableName]).getOrElseL(() =>
      Utility.throwError(
        new Error(`\`${variableName}\` is missing from the environment!`)
      )
    )
  );
}
