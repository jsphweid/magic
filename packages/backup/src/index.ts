import * as FS from "fs";
import * as Path from "path";

import * as Toggl from "~/toggl";
import * as Symbols from "~/symbols";

import symbols from "../data/symbols.json";
import tags from "../data/tags.json";
import timeEntries from "../data/timeEntries.json";

export { symbols, tags, timeEntries };

const writeAsJSON = (filePath: string, contents: object) =>
  FS.writeFileSync(
    Path.resolve(__dirname, filePath),
    JSON.stringify(contents, null, 2)
  );

export const save = async () => {
  writeAsJSON("../data/symbols.json", Symbols.all);
  writeAsJSON("../data/timeEntries.json", await Toggl.getTimeEntries());
  writeAsJSON("../data/tags.json", await Toggl.getTags());
};

// save();
