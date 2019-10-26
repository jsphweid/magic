import { pipe, TaskEither } from "@grapheng/prelude";
import * as FS from "fs";
import * as Path from "path";

import { ArchiveStorage } from ".";
import * as Archive from "../RawArchive";

const backupArchiveDir = Path.resolve(
  Path.join(__dirname, "../..", "data/backup")
);

export const archiveStorage: ArchiveStorage = {
  get: () =>
    TaskEither.tryCatchError(() =>
      pipe(
        FS.readdirSync(backupArchiveDir, "utf8")
          .filter(name => name.includes("archive"))
          .reduce((previous, current) =>
            new Date(previous.split("_")[1]).getTime() >
            new Date(current.split("_")[1]).getTime()
              ? previous
              : current
          ),
        mostRecentFileName =>
          FS.readFileSync(
            Path.join(backupArchiveDir, mostRecentFileName),
            "utf8"
          ),
        contents => Promise.resolve(JSON.parse(contents))
      )
    ),
  writeNew: (archive: Archive.RawArchive) =>
    TaskEither.tryCatchError(() =>
      pipe(
        FS.writeFileSync(
          backupArchiveDir + `/archive_${new Date().toISOString()}`,
          JSON.stringify(archive)
        ),
        () => Promise.resolve(true)
      )
    )
};

// get: () =>
// TaskEither.tryCatchError(() =>
//   JSON.parse(
//     FS.readFileSync(
//       Path.resolve(
//         __dirname,
//         "..",
//         "data/backup",
//         FS.readdirSync(backupArchiveDir, "utf8")
//           .filter(name => name.includes("archive"))
//           .reduce((previous, current) =>
//             new Date(previous.split("_")[1]).getTime() >
//             new Date(current.split("_")[1]).getTime()
//               ? previous
//               : current
//           )
//       ),
//       "utf8"
//     )
//   )
// ),
