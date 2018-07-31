import * as Functions from "firebase-functions";

import * as Toggl from "~/toggl";

import * as SMS from "./SMS";

const {
  toggl: { token: TOGGL_TOKEN, workspace: TOGGL_WORKSPACE }
} = Functions.config();

process.env = { ...process.env, TOGGL_TOKEN, TOGGL_WORKSPACE };

export const incomingTextMessage = Functions.https.onRequest(
  async (req, res) => {
    const projects = await Toggl.getProjects();
    const timeEntry = SMS.toTimeEntry(projects, req.body.Body);

    await Toggl.startTimeEntry(timeEntry);
    return res.status(200);
  }
);
