import { TaskEither } from "@grapheng/prelude";

import * as Archive from "../RawArchive";
import * as Local from "./Local";
import * as S3 from "./S3";

const { ARCHIVE_BUCKET_NAME } = process.env;

export interface ArchiveStorage {
  get: () => TaskEither.ErrorOr<Archive.RawArchive>;
  writeNew: (newArchive: Archive.RawArchive) => TaskEither.ErrorOr<boolean>;
}

export const get: ArchiveStorage["get"] = ARCHIVE_BUCKET_NAME
  ? S3.archiveStorage.get
  : Local.archiveStorage.get;

export const writeNew: ArchiveStorage["writeNew"] = ARCHIVE_BUCKET_NAME
  ? S3.archiveStorage.writeNew
  : Local.archiveStorage.writeNew;
