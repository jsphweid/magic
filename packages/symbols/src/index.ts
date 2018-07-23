import _ from "lodash";

import * as Toggl from "~/toggl";
import symbols from "../data/symbols.json";

export interface SymbolData {
  name: string;
  connections?: string[];
  value?: number;
}

export const all = symbols as SymbolData[];

export const missingFromTags = (tags: Toggl.Tag[]): string[] =>
  _
    .xorBy<{ name: string }>(tags, all, ({ name }) => name)
    .map(({ name }) => name);
