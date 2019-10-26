import { Either, pipe, TaskEither } from "@grapheng/prelude";
import Moment from "moment";

import * as ArchiveStorage from "../ArchiveStorage";
import * as RawArchive from "../RawArchive";

export interface Context {
  now: Moment.Moment;
  archiveModel: ArchiveModel;
}

// TODO: revisit RawTag exposed here? Maybe something better similar to NarrativeInput

type FieldsOnArchiveThatArePassedThrough =
  | "getRawTagsByIDs"
  | "getRawTagsByNames"
  | "getAllRawTags"
  | "getAllRawNarratives";

export interface ArchiveModel
  extends Pick<RawArchive.Archive, FieldsOnArchiveThatArePassedThrough> {
  deleteTag: (id: string) => TaskEither.ErrorOr<boolean>;
  updateTag: (
    id: string,
    updates: Partial<RawArchive.RawTag>
  ) => TaskEither.ErrorOr<RawArchive.RawTag>;
  createNewTag: (
    newTag: Partial<RawArchive.RawTag>
  ) => TaskEither.ErrorOr<RawArchive.RawTag>;
  createNewNarrative: (
    newNarrative: RawArchive.NarrativeInput
  ) => TaskEither.ErrorOr<RawArchive.RawNarrative>;
}

const takeMutateResultAndSave = (
  tagMutateResult: Either.ErrorOr<RawArchive.TagMutateResult>
): TaskEither.TaskEither<Error, RawArchive.RawTag> =>
  pipe(
    tagMutateResult,
    TaskEither.fromEither,
    result =>
      pipe(
        result,
        TaskEither.chain(result => ArchiveStorage.writeNew(result.rawArchive)),
        TaskEither.chain(() => result),
        TaskEither.map(result => result.tag)
      )
  );

export const context = async (): Promise<Context> =>
  pipe(
    ArchiveStorage.get(),
    TaskEither.map(RawArchive.makeArchive),
    TaskEither.map(archive => ({
      now: Moment(),
      archiveModel: {
        createNewTag: (
          newTag: Partial<RawArchive.RawTag>
        ): TaskEither.TaskEither<Error, RawArchive.RawTag> =>
          pipe(
            archive.createNewTag(newTag),
            takeMutateResultAndSave
          ),
        updateTag: (
          id: string,
          updates: Partial<RawArchive.RawTag>
        ): TaskEither.TaskEither<Error, RawArchive.RawTag> =>
          pipe(
            archive.updateTag(id, updates),
            takeMutateResultAndSave
          ),
        deleteTag: (id: string): TaskEither.TaskEither<Error, boolean> =>
          pipe(
            archive.deleteTag(id),
            TaskEither.fromEither,
            TaskEither.chain(result =>
              ArchiveStorage.writeNew(result.rawArchive)
            )
          ),
        createNewNarrative: (newNarrative: RawArchive.NarrativeInput) =>
          pipe(
            archive.createNewNarrative(newNarrative),
            TaskEither.fromEither,
            result =>
              pipe(
                result,
                TaskEither.chain(result =>
                  ArchiveStorage.writeNew(result.rawArchive)
                ),
                TaskEither.chain(() => result),
                TaskEither.map(result => result.narrative)
              )
          ),
        getRawTagsByIDs: archive.getRawTagsByIDs,
        getRawTagsByNames: archive.getRawTagsByNames,
        getAllRawTags: archive.getAllRawTags,
        getAllRawNarratives: archive.getAllRawNarratives
      }
    })),
    TaskEither.runUnsafe
  );
