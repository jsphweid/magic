import * as Phone from "~/phone";
import * as Toggl from "~/toggl";

(async () => {
  Phone.timeEntries(await Toggl.getProjects()).forEach(
    async ({ start, stop, project, narrative, symbols }) => {
      await Toggl.createTimeEntry({
        start,
        stop,
        project,
        description: narrative,
        tags: symbols
      });
    }
  );
})();
