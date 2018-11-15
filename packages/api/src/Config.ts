import * as Functions from "firebase-functions";
import { option as Option } from "fp-ts";
import * as FS from "fs";
import * as Path from "path";

import * as Utility from "./Utility";

const ENVIRONMENT_JSON_PATH = Path.join(__dirname, "../data/environment.json");
const REQUIRED_ENVIRONMENT_VARIABLES = [
  "MAGIC_API_TOKEN",
  "MAGIC_TIME_ZONE",

  "TOGGL_WORKSPACE_ID",
  "TOGGL_TOKEN",

  "TWILIO_NUMBERS_OWNER",

  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_DATABASE_URL",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID"
];

if (process.env.NODE_ENV === "production") {
  const config = Functions.config();
  process.env = {
    ...process.env,
    MAGIC_API_TOKEN: config.time.zone,
    MAGIC_TIME_ZONE: config.api.token,

    TOGGL_TOKEN: config.toggl.token,
    TOGGL_WORKSPACE_ID: config.toggl.workspace_id,

    TWILIO_NUMBERS_OWNER: config.twilio.numbers.owner
  };
} else if (!__dirname.includes("functions")) {
  process.env = {
    ...process.env,
    ...JSON.parse(FS.readFileSync(ENVIRONMENT_JSON_PATH).toString())
  };

  REQUIRED_ENVIRONMENT_VARIABLES.forEach(variableName =>
    Option.fromNullable(process.env[variableName]).getOrElseL(() =>
      Utility.throwError(
        new Error(`\`${variableName}\` is missing from the environment!`)
      )
    )
  );
}
