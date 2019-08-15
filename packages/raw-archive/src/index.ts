import { Either, Error, Option, pipe } from "@grapheng/prelude";
import Moment from "moment-timezone";

import * as ID from "./id";
import * as Narrative from "./narrative";
import * as Tag from "./tag";
import * as Time from "./time";

export interface Archive {
  raw: RawArchive;

  writeNewTag: (rawTag: Partial<RawTag>) => Either.ErrorOr<TagMutateResult>;
  updateTag: (
    id: string,
    updates: Partial<RawTag>
  ) => Either.ErrorOr<TagMutateResult>;
  deleteTag: (id: string) => Either.ErrorOr<DeleteResult>;
  getRawTagByID: (id: string) => Option.Option<RawTag>;
  getRawTagsByIDs: (ids: string[]) => Array<Option.Option<RawTag>>;
  getAllRawTags: () => RawTag[];
  getRawTagByName: (name: string) => Option.Option<RawTag>;
  getRawTagsByNames: (names: string[]) => Array<Option.Option<RawTag>>;

  writeNewNarrative: (
    narrative: NarrativeInput
  ) => Either.ErrorOr<NarrativeMutateResult>;
}

export interface NarrativeInput {
  description: string;
  timeSelection?: Time.Selection;
  tagsFilter?: Tag.DeepPartial<Tag.Filter>;
}

export interface RawTag {
  id: string;
  name: string;
  aliases: string[];
  connections: string[];
  meta: {
    created: number;
    updated: number;
  };
}

export interface RawNarrative {
  id: string;
  start: number;
  stop?: number;
  tags: string[];
  description: string;
  meta: {
    created: number;
    updated: number;
  };
}

export interface RawArchive {
  tags: RawTag[];
  narratives: RawNarrative[];
}

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
        Tag.existingTagIDs(otherTags),
        Either.fromPredicate(
          existingTagIDs => tag.connections.every(id => existingTagIDs[id]),
          Error.fromL(
            `Tag does not validate because at least one connection does not resolve...`
          )
        ),
        Either.map(() => Tag.existingTagNamesMap(otherTags)),
        Either.chain(
          Either.fromPredicate(
            existingTagNames =>
              Tag.getAllNamesInTagLowerCase(tag).every(
                name => !existingTagNames[name.toLowerCase()]
              ),
            Error.fromL(
              "Tag does not validate because its name already exists elsewhere..."
            )
          )
        ),
        Either.map(() => tag)
      )
  );

interface DeleteResult {
  result: boolean;
  rawArchive: RawArchive;
}

interface TagMutateResult {
  tag: RawTag;
  rawArchive: RawArchive;
}

interface NarrativeMutateResult {
  narrative: RawNarrative;
  rawArchive: RawArchive;
}

const removeUndefineds = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

export const makeArchive = (_rawArchive: RawArchive): Archive => {
  const rawArchive = getClonedArchive(_rawArchive);
  const now = Moment().valueOf();

  // TODO: make some sort of hashmap that allows finding to be more efficient
  const getTag = (id: string): Option.Option<RawTag> =>
    Option.fromNullable(rawArchive.tags.find(tag => tag.id === id));

  const getTagByName = (name: string): Option.Option<RawTag> =>
    pipe(
      rawArchive.tags.find(tag =>
        Tag.getAllNamesInTagLowerCase(tag).includes(name.toLowerCase())
      ),
      Option.fromNullable
    );

  return {
    raw: rawArchive,
    updateTag: (id, updates) =>
      pipe(
        getTag(id),
        Either.fromOption(
          Error.fromL("The tag you're trying to change does not exist")
        ),
        Either.map(foundTag => ({
          ...foundTag,
          ...removeUndefineds(updates),
          id: foundTag.id
        })),
        Either.chain(proposedTag => validateTag(proposedTag, rawArchive)),
        Either.map(validatedTag =>
          pipe(
            rawArchive.tags.findIndex(tag => tag.id === id),
            index => (rawArchive.tags[index] = validatedTag),
            () => ({
              rawArchive: makeArchive(rawArchive).raw,
              tag: validatedTag
            })
          )
        )
      ),
    deleteTag: id =>
      pipe(
        getTag(id),
        Either.fromOption(
          Error.fromL("The tag you're trying to delete does not exist")
        ),
        Either.map(() => ({
          rawArchive: makeArchive({
            narratives: rawArchive.narratives,
            tags: rawArchive.tags
              .filter(tag => tag.id !== id)
              .map(tag => ({
                ...tag,
                connections: tag.connections.filter(
                  connection => connection !== id
                )
              }))
          }).raw,
          result: true
        }))
      ),
    writeNewTag: tag =>
      pipe(
        {
          id: ID.makeUnique(),
          name: "", // it will get overridden since name is ultimately required
          aliases: [],
          ...tag,
          connections: tag.connections || [],
          meta: {
            created: now,
            updated: now
          }
        },
        proposedTag => validateTag(proposedTag, rawArchive),
        Either.map(newTag => ({
          rawArchive: makeArchive({
            ...rawArchive,
            tags: [...rawArchive.tags, newTag]
          }).raw,
          tag: newTag
        }))
      ),

    getRawTagByID: getTag,
    getRawTagByName: getTagByName,
    getRawTagsByIDs: ids => ids.map(getTag),
    getRawTagsByNames: names => names.map(getTagByName),
    getAllRawTags: () => rawArchive.tags,
    writeNewNarrative: ({ tagsFilter, timeSelection, description }) => {
      const matchingTags = Tag.getMatchingTags(
        tagsFilter || {},
        description,
        rawArchive.tags
      );

      // just iterate through the entire thing....

      const time = timeSelection
        ? Time.fromSelection(timeSelection)
        : Time.ongoingInterval();

      const interval = Time.toStoppedInterval(time);

      // Protect against mass data-deletion
      if (Time.duration(interval).asHours() > 3) {
        return Either.left(
          Error.from("You cannot select more than three hours")
        );
      }

      const now = new Date().getTime();

      const newEntry: RawNarrative = {
        id: ID.makeUnique(),
        description,
        start: time.start.valueOf(),
        tags: matchingTags.map(tag => tag.id),
        meta: {
          created: now,
          updated: now
        }
      };

      return Either.right({
        rawArchive: makeArchive({
          narratives: Narrative.addNarrative(newEntry, rawArchive.narratives),
          tags: rawArchive.tags
        }).raw,
        narrative: newEntry
      });
    }
  };
};
