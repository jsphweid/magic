import { Either, pipe } from "@grapheng/prelude";
import Moment from "moment";

import * as Archive from "../../../raw-archive/src";
import * as Local from "../Local";

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
  extends Pick<Archive.Archive, FieldsOnArchiveThatArePassedThrough> {
  createNewTag: (
    newTag: Partial<Archive.RawTag>
  ) => Either.ErrorOr<Archive.RawTag>;

  updateTag: (
    id: string,
    updates: Partial<Archive.RawTag>
  ) => Either.ErrorOr<Archive.RawTag>;

  deleteTag: (id: string) => Either.ErrorOr<boolean>;

  createNewNarrative: (
    newNarrative: Archive.NarrativeInput
  ) => Either.ErrorOr<Archive.RawNarrative>;
}

const writeNewArchive = (
  newArchive: Archive.RawArchive
): Either.ErrorOr<boolean> => Local.saveNewArchive(newArchive);

export const context = async (): Promise<Context> => {
  const archive = Archive.makeArchive(await Local.getMostRecentArchive());

  return {
    now: Moment(),
    archiveModel: {
      createNewTag: newTag =>
        // TODO: ask Conner if we are wasting a step here...
        // TODO: clean up redundant parts
        Either.chained
          .bind("result", archive.createNewTag(newTag))
          .bindL("writeResult", ({ result }) =>
            writeNewArchive(result.rawArchive)
          )
          .return(({ result }) => result.tag),
      updateTag: (id, updates) =>
        Either.chained
          .bind("result", archive.updateTag(id, updates))
          .bindL("writeResult", ({ result }) =>
            writeNewArchive(result.rawArchive)
          )
          .return(({ result }) => result.tag),
      deleteTag: id =>
        pipe(
          archive.deleteTag(id),
          Either.chain(result => writeNewArchive(result.rawArchive))
        ),

      createNewNarrative: newNarrative =>
        Either.chained
          .bind("result", archive.createNewNarrative(newNarrative))
          .bindL("writeResult", ({ result }) =>
            writeNewArchive(result.rawArchive)
          )
          .return(({ result }) => result.narrative),

      getRawTagsByIDs: archive.getRawTagsByIDs,
      getRawTagsByNames: archive.getRawTagsByNames,
      getAllRawTags: archive.getAllRawTags,
      getAllRawNarratives: archive.getAllRawNarratives
    }
  };
};
