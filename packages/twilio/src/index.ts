import _ from "lodash";

import * as Toggl from "~/toggl";
import * as Symbols from "~/symbols";

export const parseTimeEntryText = (
  projects: Toggl.Project[],
  text: string
): {
  project?: Toggl.Project;
  narrative: string;
  symbols: string[];
} => {
  const [narrative] = text.split(".");

  const symbols = _.uniq(
    Symbols.all.reduce<string[]>(
      (acc, symbol) =>
        text
          .replace(/ /g, "-")
          .toLowerCase()
          .includes(symbol.name)
          ? [...acc, symbol.name]
          : acc,
      []
    )
  );

  const project = projects.find(({ name }) => symbols.join("").includes(name));

  return { project, narrative, symbols };
};

(async () => {
  console.log(parseTimeEntryText(await Toggl.getProjects(), "test"));
})();
