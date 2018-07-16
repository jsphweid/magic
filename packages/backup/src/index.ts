import * as fs from "fs";
import * as path from "path";

import * as Toggl from "~/Toggl";
import * as Symbols from "~/Symbols";

const writeAsJSON = (filePath: string, contents: object) =>
  fs.writeFileSync(
    path.resolve(__dirname, filePath),
    JSON.stringify(contents, null, 2)
  );

writeAsJSON("../data/symbols.json", Symbols.all());

(async () => {
  const timeEntries = await Toggl.getTimeEntries();
  writeAsJSON("../data/timeEntries.json", timeEntries);

  const tags = await Toggl.getTags();
  writeAsJSON("../data/tags.json", tags);
})();
