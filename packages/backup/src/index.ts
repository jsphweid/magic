import * as FS from "fs";
import * as Path from "path";

import * as Toggl from "~/toggl";
import * as Symbols from "~/symbols";

const writeAsJSON = (filePath: string, contents: object) =>
  FS.writeFileSync(
    Path.resolve(__dirname, filePath),
    JSON.stringify(contents, null, 2)
  );

writeAsJSON("../data/symbols.json", Symbols.all);

(async () => {
  const timeEntries = await Toggl.getTimeEntries();
  writeAsJSON("../data/timeEntries.json", timeEntries);

  const tags = await Toggl.getTags();
  writeAsJSON("../data/tags.json", tags);
})();
