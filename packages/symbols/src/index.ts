import _ from "lodash";

import * as Toggl from "~/toggl";
import symbols from "../data/symbols.json";

export interface SymbolData {
  name: string;
  connections?: string[];
  score?: number;
}

export const all = symbols as SymbolData[];

export const missingFromTags = (tags: Toggl.Tag[]): string[] =>
  _
    .xorBy<{ name: string }>(tags, all, ({ name }) => name)
    .map(({ name }) => name);

export const expandConnections = (symbolNames: string[]): SymbolData[] =>
  _
    .chain(
      symbolNames.map(symbolName => {
        const symbol = all.find(({ name }) => name === symbolName);
        return !symbol
          ? []
          : [
              symbol,
              ...(symbol.connections
                ? expandConnections(symbol.connections)
                : [])
            ];
      })
    )
    .flatten()
    .uniq()
    .value();
