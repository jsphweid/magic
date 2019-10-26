import { Either, Error, Maybe, Option, pipe } from "@grapheng/prelude";
import Moment from "moment-timezone";

import { copyObject, removeNullsAndUndefineds } from "../Utility";
import * as ID from "./id";
import * as Narrative from "./narrative";
import * as Tag from "./tag";
import { PartialOrNull } from "./tag";
import * as Time from "./time";

export interface Archive {
  raw: RawArchive;

  createNewTag: (rawTag: Partial<RawTag>) => Either.ErrorOr<TagMutateResult>;
  updateTag: (
    id: string,
    updates: Partial<RawTag>
  ) => Either.ErrorOr<TagMutateResult>;
  deleteTag: (id: string) => Either.ErrorOr<DeleteResult>;
  getRawTagByID: (id: string) => Option.Option<RawTag>;
  getRawTagsByIDs: (ids: string[]) => Array<Option.Option<RawTag>>;
  getAllRawTags: () => RawTag[];
  getAllRawNarratives: () => RawNarrative[];
  getRawTagByName: (name: string) => Option.Option<RawTag>;
  getRawTagsByNames: (names: string[]) => Array<Option.Option<RawTag>>;
  updateNarrative: (
    updates: UpdateNarrativeInput
  ) => Either.ErrorOr<NarrativeMutateResult>;
  createNarrative: (
    narrative: NarrativeInput
  ) => Either.ErrorOr<NarrativeMutateResult>;
}

export type UpdateNarrativeInput = PartialOrNull<
  Omit<NarrativeInput, "timeSelection">
> & {
  id: string;
};

export interface NarrativeInput {
  description: string;
  timeSelection: Time.Selection | null;
  tagsFilter: Maybe<Tag.TagFilterInput>;
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

export interface TagMutateResult {
  tag: RawTag;
  rawArchive: RawArchive;
}

export interface NarrativeMutateResult {
  narrative: RawNarrative;
  rawArchive: RawArchive;
}

const removeUndefineds = <T>(obj: T): T => copyObject(obj);

export type TagLoader = ReturnType<typeof makeTagLoader>;

export const makeTagLoader = (tags: RawTag[]) =>
  pipe(
    tags.reduce(
      (previous, current) => ({
        ...previous,
        [current.id]: current,
        [current.name.toLowerCase()]: current,
        ...current.aliases.reduce(
          (previous, alias) => ({
            ...previous,
            [alias.toLowerCase()]: current
          }),
          {}
        )
      }),
      // tslint:disable-next-line:no-object-literal-type-assertion
      {} as { [key: string]: RawTag }
    ),
    tagMap => ({
      loadF: (idOrName: string): Option.Option<RawTag> =>
        Option.fromNullable(tagMap[idOrName.toLowerCase()]),
      load: (idOrName: string): RawTag | null =>
        tagMap[idOrName.toLowerCase()] || null,
      loadManyF: (idsOrNames: string[]): Array<Option.Option<RawTag>> =>
        idsOrNames.map(key => Option.fromNullable(tagMap[key.toLowerCase()])),
      loadMany: (idsOrNames: string[]): Array<RawTag | null> =>
        idsOrNames.map(key => tagMap[key.toLowerCase()] || null),
      loadManyWithoutMisses: (idsOrNames: string[]): RawTag[] =>
        removeNullsAndUndefineds(
          idsOrNames.map(key => tagMap[key.toLowerCase()])
        ),
      getAll: () => tags
    })
  );

export const makeArchive = (_rawArchive: RawArchive): Archive => {
  const rawArchive = getClonedArchive(_rawArchive);
  const now = Moment().valueOf();

  const tagLoader = makeTagLoader(_rawArchive.tags);

  return {
    raw: rawArchive,
    updateTag: (id, updates) =>
      pipe(
        tagLoader.loadF(id),
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
        tagLoader.loadF(id),
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
    createNewTag: tag =>
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

    getRawTagByID: tagLoader.loadF,
    getRawTagByName: tagLoader.loadF,
    getRawTagsByIDs: tagLoader.loadManyF,
    getRawTagsByNames: tagLoader.loadManyF,
    getAllRawTags: () => rawArchive.tags,
    getAllRawNarratives: () => rawArchive.narratives,
    updateNarrative: ({ id, tagsFilter, description }) =>
      pipe(
        rawArchive.narratives.findIndex(n => n.id === id),
        index => Option.fromNullable(index === -1 ? null : index),
        Either.fromOption(
          Error.fromL("The Narrative you are trying to update does not exist.")
        ),
        Either.chain(index => {
          const updatedNarrative = copyObject(rawArchive.narratives[index]);

          if (
            tagsFilter ||
            (description && description !== updatedNarrative.description)
          ) {
            const matchingTags = Tag.getMatchingTags(
              tagsFilter || {},
              description || updatedNarrative.description,
              tagLoader
            );

            updatedNarrative.tags = matchingTags.map(t => t.id);
          }

          if (description) {
            updatedNarrative.description = description;
          }

          const narrativesCopy = copyObject(rawArchive.narratives);
          narrativesCopy[index] = updatedNarrative;

          return Either.right({
            rawArchive: makeArchive({
              narratives: narrativesCopy,
              tags: rawArchive.tags
            }).raw,
            narrative: updatedNarrative
          });
        })
      ),
    createNarrative: ({ tagsFilter, timeSelection, description }) => {
      const matchingTags = Tag.getMatchingTags(
        tagsFilter || {},
        description,
        tagLoader
      );

      // just iterate through the entire thing....
      const time = timeSelection
        ? Time.fromSelection(timeSelection)
        : Time.ongoingInterval();

      const interval = Time.toStoppedInterval(time);

      // Protect against mass data-deletion
      if (Time.duration(interval).asHours() > 10) {
        return Either.left(Error.from("You cannot select more than ten hours"));
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
