import { pipe, TaskEither } from "@grapheng/prelude";
import Moment from "moment";
import * as RawArchive from "raw-archive";

import * as ArchiveStorage from "../ArchiveStorage";

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

export const context = async (): Promise<Context> =>
  pipe(
    ArchiveStorage.get(),
    TaskEither.map(RawArchive.makeArchive),
    TaskEither.map(archive => ({
      now: Moment(),
      archiveModel: {
        createNewTag: (newTag: Partial<RawArchive.RawTag>) =>
          // TODO: ask Conner if we are wasting a step here...
          // TODO: clean up redundant parts
          TaskEither.chained
            .bind(
              "result",
              pipe(
                archive.createNewTag(newTag),
                TaskEither.fromEither
              )
            )
            .bindL("writeResult", ({ result }) =>
              ArchiveStorage.writeNew(result.rawArchive)
            )
            .return(({ result }) => result.tag),
        updateTag: (id: string, updates: Partial<RawArchive.RawTag>) =>
          TaskEither.chained
            .bind(
              "result",
              pipe(
                archive.updateTag(id, updates),
                TaskEither.fromEither
              )
            )
            .bindL("writeResult", ({ result }) =>
              ArchiveStorage.writeNew(result.rawArchive)
            )
            .return(({ result }) => result.tag),

        deleteTag: (id: string) =>
          pipe(
            archive.deleteTag(id),
            TaskEither.fromEither,
            TaskEither.chain(result =>
              ArchiveStorage.writeNew(result.rawArchive)
            )
          ),
        createNewNarrative: (newNarrative: RawArchive.NarrativeInput) =>
          TaskEither.chained
            .bind(
              "result",
              pipe(
                archive.createNewNarrative(newNarrative),
                TaskEither.fromEither
              )
            )
            .bindL("writeResult", ({ result }) =>
              ArchiveStorage.writeNew(result.rawArchive)
            )
            .return(({ result }) => result.narrative),
        getRawTagsByIDs: archive.getRawTagsByIDs,
        getRawTagsByNames: archive.getRawTagsByNames,
        getAllRawTags: archive.getAllRawTags,
        getAllRawNarratives: archive.getAllRawNarratives
      }
    })),
    TaskEither.runUnsafe
  );
