import * as FS from "fs";
import * as Path from "path";

import { RawArchive } from "./Schema/Context/Archive";

// import { BACKUP_DIR } from './Backup'
// import { RawArchive } from "./Schema/Context/Archive";

// export const save = (filePath: string, contents: string): void => {
//   const backupPath = `${BACKUP_DIR}/${filePath}`;
//   FS.writeFileSync(backupPath, contents);

//   // tslint:disable-next-line:no-console
//   console.log(`Saved \`${backupPath}\``);
// };

// Write a JSON file
// const saveJson = (filePath: string, contents: object): void =>
//   save(filePath, JSON.stringify(contents, null, 2));

const backupArchiveDir = Path.resolve(
  Path.join(__dirname, "..", "data/backup")
);

export const getMostRecentArchive = (): Promise<RawArchive> => {
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

export const saveNewArchive = (archive: RawArchive): Promise<void> =>
  Promise.resolve(
    FS.writeFileSync(
      backupArchiveDir + `archive_${new Date().toISOString()}`,
      JSON.stringify(archive)
    )
  );

// console.log(getMostRecentLocalArchive());

// export const saveNewRawArchiveVersion = (rawArchive: RawArchive) void => FS
