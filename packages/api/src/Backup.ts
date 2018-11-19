import Firebase from "firebase";
import * as FS from "fs";
import Moment from "moment";
import * as Path from "path";

import "./Config";
import * as Toggl from "./Toggl";
import * as Utility from "./Utility";

// const MAGIC_START = Moment("2018-06-22T13:10:55+00:00");

const DATA_DIR = Path.join(__dirname, "../data");
const BACKUP_DIR = `${DATA_DIR}/backup`;

// Write a JSON backup file
const saveJson = (filePath: string, contents: object): void => {
  const backupPath = `${BACKUP_DIR}/${filePath}`;
  FS.writeFileSync(backupPath, JSON.stringify(contents, null, 2));

  // tslint:disable-next-line:no-console
  console.log(`Saved \`${backupPath}\``);
};

(async () => {
  const DB = Firebase.firestore();

  // Don't run when deploying to Firebase
  if (__dirname.includes("functions")) return;

  // Save the Toggl and Magic versions of every tag
  const magicTags: { [ID: string]: any } = {};
  (await DB.collection("tags").get()).forEach(async document => {
    const data = document.data();
    if (data.connections) {
      data.connections = data.connections.map(
        (connection: any) => connection.id
      );
    }

    magicTags[document.id] = {
      ...data
    };
  });

  saveJson(`magic/tags.json`, magicTags);
  saveJson(
    `toggl/tags.json`,
    (await Toggl.getTags()).getOrElseL(Utility.throwError)
  );

  // Save every entry since tracking began
  // saveJson(
  //   `toggl/time-entries.json`,
  //   (await Toggl.Entry.getInterval(MAGIC_START, Moment())).getOrElseL(
  //     Utility.throwError
  //   )
  // );

  // Save every timeline record since tracking began
  saveJson(
    `toggl/timeline-records.json`,
    (await Toggl.Timeline.getInterval({
      start: Moment().subtract(2, "months"),
      stop: Moment()
    })).getOrElseL(Utility.throwError)
  );

  process.exit(0);
})();
