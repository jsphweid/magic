import * as Toggl from "~/toggl";
import * as Symbols from "~/symbols";

(async () => {
  const tags = await Toggl.getTags();
  console.log(Symbols.missingFromTags(tags));
})();
