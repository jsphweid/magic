import * as FS from "fs";
import * as Path from "path";

import Moment from "moment";

import * as Toggl from "~/toggl";
import * as Time from "~/time";

const togglSecrets = {
  token: `${process.env.TOGGL_TOKEN}`,
  workspaceId: `${process.env.TOGGL_WORKSPACE_ID}`
};

export const save = async () => {
  writeAsJSON("../data/time-tags.json", Time.Tag.all);
  writeAsJSON("../data/toggl-tags.json", await Toggl.getTags(togglSecrets));

  writeAsJSON(
    "../data/toggl-time-entries.json",
    await Toggl.getTimeEntries(togglSecrets, {
      start: Moment().subtract(2, "years")
    })
  );
};

const writeAsJSON = (filePath: string, contents: object) =>
  FS.writeFileSync(
    Path.resolve(__dirname, filePath),
    JSON.stringify(contents, null, 2)
  );

save();
