import _ from "lodash";
import { option as Option } from "fp-ts";

import * as Toggl from "~/toggl";

import * as Score from "./Score";
import DATA from "../data/tags.json";

export interface Tag {
  name: string;
  connections: string[];
  score: Score.Name;
}

export const fromName = (name: string): Option.Option<Tag> =>
  Option.fromNullable(DATA.find(tag => tag.name === name)).map(fromData);

const fromData = (data: {
  name: string;
  connections?: string[];
  score?: string;
}): Tag => ({
  ...data,
  score: Score.nameFromString(data.score || "NEUTRAL"),
  connections: data.connections || []
});

export const all: Tag[] = DATA.map(fromData);

export const allFromNames = (tagNames: string[]): Tag[] =>
  _.chain(
    tagNames.map(tagName => {
      const tag = all.find(({ name }) => name === tagName);

      if (!tag) {
        return [];
      }

      const connections = tag.connections ? allFromNames(tag.connections) : [];
      return [tag, ...connections];
    })
  )
    .flatten()
    .uniq()
    .value();

export const missingFromData = (tags: Toggl.Tag[]): string[] =>
  _.xorBy<{ name: string }>(tags, all, ({ name }) => name).map(
    ({ name }) => name
  );
