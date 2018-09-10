import * as FS from "fs";
import * as Path from "path";

import Moment from "moment";

import * as Toggl from "~/toggl";
import * as Time from "~/time";

const BACKUP_DIR = "../.data";

const save = async (): Promise<void> => {
  // Save the Toggl and Magic versions of every tag

  writeAsJSON(`${BACKUP_DIR}/time-tags.json`, Time.Tag.all);

  const { value: togglTags } = await Toggl.getTags();
  if (togglTags instanceof Error) {
    throw togglTags;
  }

  writeAsJSON(`${BACKUP_DIR}/toggl-tags.json`, togglTags);

  // Save every time entry

  const { value: togglTimeEntries } = await Toggl.getTimeEntries({
    // This is when tracking began
    start: Moment("2018-06-22T13:10:55+00:00")
  });

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

save();
