import { Either, Error, Option, pipe } from "@grapheng/prelude";

import * as ID from "./id";

export interface Archive {
  raw: RawArchive;
  writeNewTag: (rawTag: Partial<RawTag>) => Either.ErrorOr<Archive>;
  mutateTag: (id: string, updates: Partial<RawTag>) => Either.ErrorOr<Archive>;

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

interface StringMembershipMap {
  [key: string]: boolean;
}

const arrToMap = (arr: string[]): StringMembershipMap =>
  arr.reduce((previous, current) => ({ ...previous, [current]: true }), {});

const existingTagNamesMap = (tags: RawTag[]): StringMembershipMap =>
  tags.reduce(
    (previous, current) => ({
      ...previous,
      ...arrToMap(getAllNamesInTagLowerCase(current))
    }),
    {}
  );

const existingTagIDs = (tags: RawTag[]): StringMembershipMap =>
  tags.reduce((previous, current) => ({ ...previous, [current.id]: true }), {});

const getAllNamesInTagLowerCase = (rawTag: Partial<RawTag>): string[] => [
  ...(rawTag.aliases || []).map(str => str.toLowerCase()),
  ...(rawTag.name ? [rawTag.name.toLowerCase()] : [])
];

const getClonedArchive = (rawArchive: RawArchive): RawArchive =>
  JSON.parse(JSON.stringify(rawArchive));

const validateTag = (
  tag: RawTag,
  archive: RawArchive
): Either.ErrorOr<RawTag> =>
  pipe(
    archive.tags.filter(t => t.id !== tag.id),
    otherTags =>
      pipe(
        existingTagIDs(otherTags),
        Either.fromPredicate(
          existingTagIDs => tag.connections.every(id => existingTagIDs[id]),
          Error.fromL(
            `Tag does not validate because at least one connection does not resolve...`
          )
        ),
        Either.map(() => existingTagNamesMap(otherTags)),
        Either.map(
          Either.fromPredicate(
            existingTagNames =>
              getAllNamesInTagLowerCase(tag).every(
                name => !existingTagNames[name.toLowerCase()]
              ),
            Error.fromL(
              "Tag does not validate because its name already exists elsewhere..."
            )
          )
        ),
        Either.flatten,
        Either.map(() => tag)
      )
  );

export const makeArchive = (_rawArchive: RawArchive): Archive => {
  const rawArchive = getClonedArchive(_rawArchive);
  const getTag = (id: string): Option.Option<RawTag> =>
    Option.fromNullable(rawArchive.tags.find(tag => tag.id === id));

  return {
    raw: rawArchive,
    mutateTag: (id, updates) =>
      pipe(
        getTag(id),
        Either.fromOption(
          Error.fromL("The tag you're trying to change does not exist")
        ),
        Either.map(foundTag => ({ ...foundTag, ...updates, id: foundTag.id })),
        Either.map(proposedTag => validateTag(proposedTag, rawArchive)),
        Either.flatten,
        Either.map(validatedTag =>
          pipe(
            rawArchive.tags.findIndex(tag => tag.id === id),
            index => (rawArchive.tags[index] = validatedTag),
            () => makeArchive(rawArchive)
          )
        )
      ),

    writeNewTag: tag =>
      pipe(
        {
          id: ID.makeUnique(),
          name: "", // it will get overridden since name is ultimately required
          aliases: [],
          ...tag,
          connections: tag.connections || []
        },
        proposedTag => validateTag(proposedTag, rawArchive),
        Either.map(newTag =>
          makeArchive({
            ...rawArchive,
            tags: [...rawArchive.tags, newTag]
          })
        )
      ),

    getRawTagByID: getTag,
    getRawTagsByIDs: ids => ids.map(getTag),
    getAllTags: () => rawArchive.tags,
    getRawTagByName: name =>
      pipe(
        rawArchive.tags.find(tag =>
          getAllNamesInTagLowerCase(tag).includes(name.toLowerCase())
        ),
        Option.fromNullable
      )
  };
};
