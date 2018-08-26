import _ from "lodash";

import * as Toggl from "~/toggl";
import * as Time from "~/time";

export const toTimeEntry = (
  projects: Toggl.Project[],
  text: string
): {
  project?: Toggl.Project;
  description: string;
  tags: string[];
} => {
  const formattedText = text.replace(/ /g, "-").toLowerCase();
  const symbols = _.uniq(
    Time.Tag.all.reduce<string[]>(
      (acc, symbol) =>
        formattedText.includes(symbol.name) ? [...acc, symbol.name] : acc,
      []
    )
  );

  return {
    project: projects.find(({ name }) => symbols.join("").includes(name)),
    description: _.first(text.split(".")) || text,
    tags: symbols
  };
};
