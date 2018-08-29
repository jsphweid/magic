import * as Functions from "firebase-functions";

if (process.env.NODE_ENV === "production") {
  const {
    toggl: { token: TOGGL_TOKEN, workspace_id: TOGGL_WORKSPACE_ID },
    twilio: {
      numbers: { owner: TWILIO_NUMBERS_OWNER }
    }
  } = Functions.config();

  process.env = {
    ...process.env,

    TOGGL_TOKEN,
    TOGGL_WORKSPACE_ID,

    TWILIO_NUMBERS_OWNER
  };
}
