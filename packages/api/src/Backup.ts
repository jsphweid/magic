import * as FS from "fs";
import * as Path from "path";
import Moment from "moment";

import * as Toggl from "./Toggl";

const DATA_DIR = Path.join(__dirname, "../.data");
const BACKUP_DIR = `${DATA_DIR}/backup`;

const save = async (): Promise<void> => {
  // Save the Toggl and Magic versions of every tag

  writeAsJSON(
    `${BACKUP_DIR}/magic-tags.json`,
    FS.readFileSync(`${DATA_DIR}/tags.json`).toJSON()
  );

  const { value: togglTags } = await Toggl.getTags();
  if (togglTags instanceof Error) {
    throw togglTags;
  }

  writeAsJSON(`${BACKUP_DIR}/toggl-tags.json`, togglTags);

  // Save every time entry

  const { value: togglTimeEntries } = await Toggl.TimeEntry.getInterval(
    // This is when tracking began
    Moment("2018-06-22T13:10:55+00:00"),
    Moment()
  );

  if (togglTimeEntries instanceof Error) {
    throw togglTimeEntries;
  }

  writeAsJSON(`${BACKUP_DIR}/toggl-time-entries.json`, togglTimeEntries);
};

const writeAsJSON = (filePath: string, contents: object): void =>
  FS.writeFileSync(
    Path.resolve(__dirname, filePath),
    JSON.stringify(contents, null, 2)
  );

// Always backup while developing
if (process.env.NODE_ENV !== "production" && !__dirname.includes("functions")) {
  save();
}
