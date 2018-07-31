import * as Toggl from "~/toggl";

(async () => {
  console.log(await Toggl.getProjects());
})();
