import * as Toggl from "~/toggl";
import * as Symbols from "~/symbols";

(async () => {
  const tags = await Toggl.getTags();
  const tagsMissingSymbols = Symbols.missingFromTags(tags);

  console.log(tagsMissingSymbols);
})();
