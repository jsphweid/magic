import * as FS from "fs";
import * as Path from "path";

import Moment from "moment";

import * as Toggl from "~/toggl";
import * as Symbols from "~/symbols";

const writeAsJSON = (filePath: string, contents: object) =>
  FS.writeFileSync(
    Path.resolve(__dirname, filePath),
    JSON.stringify(contents, null, 2)
  );

export const save = async () => {
  const timeEntries = await Toggl.getTimeEntries(
    Moment().subtract(2, "years"),
    Moment()
  );

  writeAsJSON("../data/symbols.json", Symbols.all);
  writeAsJSON("../data/timeEntries.json", timeEntries);
  writeAsJSON("../data/tags.json", await Toggl.getTags());
};

save();
