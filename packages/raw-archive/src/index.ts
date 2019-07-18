import { Either, Option } from "@grapheng/prelude";

import * as ID from "./id";

export interface Archive {
  raw: RawArchive;
  writeNewTag: (rawTag: Partial<RawTag>) => Either.ErrorOr<Archive>;

  getRawTagByID: (id: string) => Option.Option<RawTag>;
  getRawTagsByIDs: (ids: string[]) => Array<Option.Option<RawTag>>;
  getAllTags: () => RawTag[];
  getRawTagByName: (name: string) => Option.Option<RawTag>;
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
      ...arrToMap(getAllNamesInTagLowerCase(current))
    }),
    {}
  );

const getAllNamesInTagLowerCase = (rawTag: Partial<RawTag>): string[] => [
  ...(rawTag.aliases || []).map(str => str.toLowerCase()),
  ...(rawTag.name ? [rawTag.name.toLowerCase()] : [])
];

const getClonedArchive = (rawArchive: RawArchive): RawArchive =>
  JSON.parse(JSON.stringify(rawArchive));

export const makeArchive = (_rawArchive: RawArchive): Archive => {
  const rawArchive = getClonedArchive(_rawArchive);
  return {
    raw: rawArchive,
    writeNewTag: tag => {
      const existingTagNames = existingTagNamesMap(rawArchive.tags);
      const tagIsUnique = getAllNamesInTagLowerCase(tag).every(
        name => !existingTagNames[name.toLowerCase()]
      );
      const newTag = {
        id: ID.makeUnique(),
        name: "", // it will get overridden since name is ultimately required
        aliases: [],
        ...tag,
        connections: [] // a new tag cannot have connections already for now
      };

      return tagIsUnique
        ? Either.right(
            makeArchive({
              ...rawArchive,
              tags: [...rawArchive.tags, newTag]
            })
          )
        : Either.left(
            new Error(
              "Could not add this tag because its name already exists in other tags"
            )
          );
    },
    getRawTagByID: id =>
      Option.fromNullable(rawArchive.tags.find(tag => tag.id === id)),
    getRawTagsByIDs: ids =>
      ids.map(id =>
        Option.fromNullable(rawArchive.tags.find(tag => tag.id === id))
      ),
    getAllTags: () => rawArchive.tags,
    getRawTagByName: name =>
      Option.fromNullable(
        rawArchive.tags.find(tag =>
          getAllNamesInTagLowerCase(tag).includes(name.toLowerCase())
        )
      )
  };
};
