import { Either, pipe } from "@grapheng/prelude";
import * as FS from "fs";
import Moment from "moment";
import * as Path from "path";

// tslint:disable-next-line:no-var-requires
require("dotenv").config({
  path: Path.resolve(__dirname, "../local.env")
});

import * as Time from "./Schema/Time";
import * as Toggl from "./Toggl";

const MAGIC_START = Moment("2018-06-22T13:10:55+00:00");
const DATA_DIR = Path.join(__dirname, "../data");
export const BACKUP_DIR = `${DATA_DIR}/backup`;

// Write a text file
export const save = (filePath: string, contents: string): void => {
  const backupPath = `${BACKUP_DIR}/${filePath}`;
  FS.writeFileSync(backupPath, contents);

  // tslint:disable-next-line:no-console
  console.log(`Saved \`${backupPath}\``);
};

// Write a JSON file
const saveJson = (filePath: string, contents: object): void =>
  save(filePath, JSON.stringify(contents, null, 2));

(async () => {
  // Don't run when deploying to Firebase
  if (__dirname.includes("functions")) return;

  // Grab every entry since tracking began
  pipe(
    await Toggl.getEntriesFromTime(Time.ongoingInterval(MAGIC_START)),
    Either.map(entries => {
      saveJson(`toggl/entries.json`, entries);
    })
  );

  process.exit(0);
})();
