import * as FS from "fs";

import Moment from "moment";

import * as Toggl from "~/toggl";
import * as Sleep from "~/sleep";

(async () => {
  const sleep = Sleep.fromTimeEntries(await Toggl.getTimeEntries());

  const CSV = sleep
    .map(
      ({ from, to }) =>
        `${from.format("MM/DD/YYYY")},${Moment.duration(
          to.diff(from)
        ).asHours()}`
    )
    .join("\n");

  FS.writeFileSync("packages/testing/data/sleep.csv", CSV);
})();
