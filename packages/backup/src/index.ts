import * as FS from "fs";
import * as Path from "path";

import Moment from "moment";

import * as Toggl from "~/toggl";
import * as Time from "~/time";

const save = async (): Promise<void> => {
  writeAsJSON("../data/time-tags.json", Time.Tag.all);

  const togglTags = await Toggl.getTags();
  if (togglTags.isLeft()) {
    throw togglTags;
  }

  writeAsJSON("../data/toggl-tags.json", togglTags.value);

  const togglTimeEntries = await Toggl.getTimeEntries({
    start: Moment("2018-06-22T13:10:55+00:00")
  });

  if (togglTimeEntries.isLeft()) {
    throw togglTimeEntries;
  }

  writeAsJSON("../data/toggl-time-entries.json", togglTimeEntries.value);
};

const writeAsJSON = (filePath: string, contents: object): void =>
  FS.writeFileSync(
    Path.resolve(__dirname, filePath),
    JSON.stringify(contents, null, 2)
  );

save();
