import * as FS from "fs";

import _ from "lodash";
import Moment from "moment";

import * as Backup from "~/backup";
import * as Symbols from "~/symbols";

const expandSymbols = (symbolNames: string[]): Symbols.SymbolData[] =>
  _
    .chain(
      symbolNames.map(symbolName => {
        const symbol = Symbols.all.find(({ name }) => name === symbolName);

        if (!symbol) {
          return [];
        }

        return [
          symbol,
          ...(symbol.connections ? expandSymbols(symbol.connections) : [])
        ];
      })
    )
    .flatten()
    .uniq()
    .value();

const scores = Backup.timeEntries.map(({ start, stop, description, tags }) => {
  const from = Moment(start);
  const to = Moment(stop);

  const duration = Moment.duration(to.diff(from)).asHours();

  return {
    narrative: description,
    from: from.format("MM/DD/YYYY h:mm A"),
    to: to.format("MM/DD/YYYY h:mm A"),
    duration,
    value: _.sumBy(tags ? expandSymbols(tags) : [], "value") * duration
  };
});

FS.writeFileSync(
  "packages/testing/data/scores.csv",
  `Date,Narrative,Duration,Value\n${scores
    .map(
      ({ from, narrative, duration, value }) =>
        `${from},"${narrative}",${duration},${value}`
    )
    .join("\n")}`
);
