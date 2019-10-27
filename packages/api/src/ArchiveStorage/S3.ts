import { TaskEither } from "@grapheng/prelude";
import * as AWS from "aws-sdk";

import { ArchiveStorage } from ".";
import * as Archive from "../RawArchive";

const s3 = new AWS.S3();

const archiveBucketName = process.env.ARCHIVE_BUCKET_NAME as string;

export const archiveStorage: ArchiveStorage = {
  get: () =>
    TaskEither.tryCatchError(() =>
      s3
        .getObject({ Bucket: archiveBucketName, Key: "archive.json" })
        .promise()
        .then(response =>
          JSON.parse((response.Body as Buffer).toString("utf-8"))
        )
    ),
  writeNew: (newArchive: Archive.RawArchive) =>
    TaskEither.tryCatchError(() =>
      s3
        .putObject({
          Bucket: archiveBucketName,
          Key: "archive.json",
          Body: JSON.stringify(newArchive)
        })
        .promise()
        .then(response => void console.log("response", response) || true)
    )
};
