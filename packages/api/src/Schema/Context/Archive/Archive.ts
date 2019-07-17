import { option as Option } from "fp-ts";

import * as Local from "../../Local";
import * as Result from "../../Result";
import { makeRandomUniqueID } from "../../Utility";

export interface Archive {
  raw: RawArchive;
  getRawTagByID: (id: string) => Option.Option<RawTag>;
  getRawTagsByIDs: (ids: string[]) => Array<Result.Result<RawTag>>;
  getRawTagByName: (name: string) => Option.Option<RawTag>;
  getAllTags: () => RawTag[];
  writeNewTag: (rawTag: Partial<RawTag>) => Promise<RawTag | null>;
}

export interface RawTag {
  name: string;
  id: string;
  aliases: string[];
  connections: string[];
}

export interface RawEntry {
  start: number;
  end?: number;
  tags: string[];
  description: string;
}

export interface RawArchive {
  tags: RawTag[];
  entries: RawEntry[];
}

interface NameMembershipMap {
  [key: string]: boolean;
}

const arrToMap = (arr: string[]): NameMembershipMap =>
  arr.reduce((previous, current) => ({ ...previous, [current]: true }), {});

const existingTagNamesMap = (tags: RawTag[]): NameMembershipMap =>
  tags.reduce(
    (previous, current) => ({
      ...previous,
      ...arrToMap(getAllNamesInTag(current))
    }),
    {}
  );

const getAllNamesInTag = (rawTag: Partial<RawTag>): string[] => [
  ...(rawTag.aliases || []),
  ...(rawTag.name ? [rawTag.name] : [])
];

const getClonedArchive = (rawArchive: RawArchive): RawArchive =>
  JSON.parse(JSON.stringify(rawArchive));

export const makeArchive = (rawArchive: RawArchive): Archive => ({
  raw: rawArchive,

  writeNewTag: tag => {
    const clonedArchive = getClonedArchive(rawArchive);
    const existingTagNames = existingTagNamesMap(rawArchive.tags);
    const tagIsUnique = getAllNamesInTag(tag).every(
      name => !existingTagNames[name]
    );
    const newTag = {
      id: makeRandomUniqueID(),
      name: "", // it will get overridden since name is ultimately required
      aliases: [],
      ...tag,
      connections: [] // a new tag cannot have connections already for now
    };
    return tagIsUnique
      ? Local.saveNewArchive({
          ...clonedArchive,
          tags: [...clonedArchive.tags, newTag]
        }).then(() => newTag)
      : Promise.resolve(null);
  },
  getRawTagByID: id =>
    Option.fromNullable(rawArchive.tags.find(tag => tag.id === id)),
  getRawTagsByIDs: ids =>
    ids.map(id => {
      const tag = rawArchive.tags.find(tag => tag.id === id);
      return tag ? Result.success(tag) : Result.error("");
    }),
  getRawTagByName: name =>
    Option.fromNullable(
      rawArchive.tags.find(tag => [...tag.aliases, tag.name].includes(name))
    ),
  getAllTags: () => rawArchive.tags
});
