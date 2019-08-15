import { Either, pipe } from "@grapheng/prelude";
import * as FS from "fs";
import * as Path from "path";

import * as Archive from "../../raw-archive/src";

const backupArchiveDir = Path.resolve(
  Path.join(__dirname, "..", "data/backup")
);

export const getMostRecentArchive = (): Promise<Archive.RawArchive> => {
  const mostRecentFile = FS.readdirSync(backupArchiveDir, "utf8")
    .filter(name => name.includes("archive"))
    .reduce((previous, current) =>
      new Date(previous.split("_")[1]).getTime() >
      new Date(current.split("_")[1]).getTime()
        ? previous
        : current
    );
  return Promise.resolve(
    JSON.parse(
      FS.readFileSync(
        Path.resolve(__dirname, "..", "data/backup", mostRecentFile),
        "utf8"
      )
    )
  );
};

export const saveNewArchive = (archive: Archive.RawArchive) =>
  Either.tryCatchError(() =>
    pipe(
      FS.writeFileSync(
        backupArchiveDir + `/archive_${new Date().toISOString()}`,
        JSON.stringify(archive)
      ),
      () => true
    )
  );
