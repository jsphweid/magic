import { Either, pipe } from "@grapheng/prelude";
import Moment from "moment";

import * as Archive from "../../../raw-archive/src";
import * as Local from "../Local";

export interface Context {
  now: Moment.Moment;
  archiveModel: ArchiveModel;
}

type FieldsOnArchiveThatArePassedThrough =
  | "getRawTagsByIDs"
  | "getRawTagsByNames"
  | "getAllRawTags"
  | "getAllRawNarratives";

export interface ArchiveModel
  extends Pick<Archive.Archive, FieldsOnArchiveThatArePassedThrough> {
  writeNewTag: (
    newTag: Partial<Archive.RawTag>
  ) => Either.ErrorOr<Archive.RawTag>;

  updateTag: (
    id: string,
    updates: Partial<Archive.RawTag>
  ) => Either.ErrorOr<Archive.RawTag>;

  deleteTag: (id: string) => Either.ErrorOr<boolean>;
}

const writeNewArchive = (
  newArchive: Archive.RawArchive
): Either.ErrorOr<boolean> => Local.saveNewArchive(newArchive);

export const context = async (): Promise<Context> => {
  const archive = Archive.makeArchive(await Local.getMostRecentArchive());

  return {
    now: Moment(),
    archiveModel: {
      writeNewTag: newTag =>
        // TODO: ask Conner if we are wasting a step here...
        // TODO: clean up redundant parts
        Either.chained
          .bind("result", archive.writeNewTag(newTag))
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

      getRawTagsByIDs: archive.getRawTagsByIDs,
      getRawTagsByNames: archive.getRawTagsByNames,
      getAllRawTags: archive.getAllRawTags,
      getAllRawNarratives: archive.getAllRawNarratives
    }
  };
};
