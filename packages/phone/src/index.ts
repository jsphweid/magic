import _ from "lodash";
import Moment from "moment";

import * as Toggl from "~/toggl";
import * as Symbols from "~/symbols";

import texts from "../data/texts.json";

export const parseTimeEntryText = (
  projects: Toggl.Project[],
  text: string
): {
  project?: Toggl.Project;
  narrative: string;
  symbols: string[];
} => {
  const [narrative, rawSymbols] = text.split(".");

  const symbolsInNarrative = Symbols.all.reduce<string[]>(
    (acc, symbol) =>
      narrative
        .replace(/ /g, "-")
        .toLowerCase()
        .includes(symbol.name)
        ? [...acc, symbol.name]
        : acc,
    []
  );

  const symbolsInRawSymbols = !rawSymbols
    ? []
    : rawSymbols
        .toLocaleLowerCase()
        .split(",")
        .map(symbol => symbol.trim().replace(" ", "-"))
        .filter(symbol => symbol !== "");

  const symbols = _.uniq([...symbolsInNarrative, ...symbolsInRawSymbols]);
  const project = projects.find(({ name }) => symbols.join("").includes(name));

  return { project, narrative, symbols };
};

export const timeEntries = (projects: Toggl.Project[]) =>
  texts
    .reduceRight<{
      previousFrom?: Moment.Moment;
      timeEntries: Array<{
        stop: Moment.Moment;
        start: Moment.Moment;
        project?: Toggl.Project;
        narrative: string;
        symbols: string[];
      }>;
    }>(
      (acc, [time, text]) => {
        const timeEntry = {
          start: Moment(`2018-07-24 ${time}-05:00`),
          stop: acc.previousFrom ? acc.previousFrom : Moment(),
          ...parseTimeEntryText(projects, text)
        };

        return {
          previousFrom: timeEntry.start,
          timeEntries: [...acc.timeEntries, timeEntry]
        };
      },
      {
        timeEntries: []
      }
    )
    .timeEntries.reverse();
