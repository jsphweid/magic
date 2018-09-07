import * as Functions from "firebase-functions";

if (process.env.NODE_ENV === "production") {
  const config = Functions.config();
  process.env = {
    ...process.env,
    API_TOKEN: config.api.token,
    TOGGL_TOKEN: config.toggl.token,
    TOGGL_WORKSPACE_ID: config.toggl.workspace_id,
    TWILIO_NUMBERS_OWNER: config.twilio.numbers.owner
  };
}

const required = [
  "API_TOKEN",
  "TOGGL_TOKEN",
  "TOGGL_WORKSPACE_ID",
  "TWILIO_NUMBERS_OWNER"
];

for (const variable of required) {
  if (process.env[variable] === undefined || process.env[variable] === null) {
    throw new Error(`\`${variable}\` is missing from the environment!`);
  }
}
