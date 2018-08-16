import _ from "lodash";

import * as Toggl from "~/toggl";

import * as Score from "./Score";
import DATA from "../data/tags.json";

export interface Tag {
  name: string;
  connections?: string[];
  score: Score.Name;
}

export const all: Tag[] = DATA.map(tag => ({
  ...tag,
  score: Score.nameFromString(tag.score || "NEUTRAL")
}));

export const fromNames = (tagNames: string[]): Tag[] =>
  _.chain(
    tagNames.map(tagName => {
      const tag = all.find(({ name }) => name === tagName);

      if (!tag) {
        return [];
      }

      if (!tag.connections) {
        return [tag];
      }

      return [tag, ...fromNames(tag.connections)];
    })
  )
    .flatten()
    .uniq()
    .value();

export const missingFromData = (tags: Toggl.Tag[]): string[] =>
  _.xorBy<{ name: string }>(tags, all, ({ name }) => name).map(
    ({ name }) => name
  );
