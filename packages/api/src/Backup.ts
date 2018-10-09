import * as FS from "fs";
import Moment from "moment";
import * as Path from "path";

import Firebase from "firebase";
// require("firebase/firestore");

import * as Toggl from "./Toggl";
import * as Utility from "./Utility";

const DATA_DIR = Path.join(__dirname, "../.data");
const BACKUP_DIR = `${DATA_DIR}/backup`;

Firebase.initializeApp();

const db = Firebase.firestore();
db.settings({ timestampsInSnapshots: true });

(async () => {
  for (const document of (await db.collection("tags").get()).docs) {
    console.log(document.data());
  }
})();

console.log(1);

const save = async () => {
  // Save the Toggl and Magic versions of every tag

  FS.writeFileSync(
    `${BACKUP_DIR}/magic/tags.json`,
    FS.readFileSync(`${DATA_DIR}/tags.json`).toString()
  );

  const { value: togglTags } = (await Toggl.getTags()).mapLeft(
    Utility.throwError
  );

  writeAsJSON(`${BACKUP_DIR}/toggl/tags.json`, togglTags);

  // Save every entry since tracking began

  const { value: entries } = (await Toggl.Entry.getInterval(
    Moment("2018-06-22T13:10:55+00:00"),
    Moment()
  )).mapLeft(Utility.throwError);

  writeAsJSON(`${BACKUP_DIR}/toggl/time-entries.json`, entries);
};

const writeAsJSON = (filePath: string, contents: object): void =>
  FS.writeFileSync(
    Path.resolve(__dirname, filePath),
    JSON.stringify(contents, null, 2)
  );

if (process.env.NODE_ENV !== "production" && !__dirname.includes("functions")) {
  if (false) {
    save();
  }
}
