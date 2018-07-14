import _ from "lodash";

import * as Toggl from "~/Toggl";
import symbols from "../data/symbols.json";

interface SymbolData {
  name: string;
  connections?: string[];
  value?: number;
}

export const all = () => symbols as SymbolData[];

export const missingFromTags = async (): Promise<string[]> => {
  const tags = await Toggl.getTags();
  return _
    .xorBy(tags, all() as Array<{ name: string }>, "name")
    .map(_.property("name"));
};
