import * as Toggl from "~/toggl";
import * as Tag from "~/tag";

(async () => {
  console.log(Tag.missingFromData(await Toggl.getTags()));
})();
