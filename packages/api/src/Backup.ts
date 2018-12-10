import Firebase, { firestore as Firestore } from "firebase";
import * as FS from "fs";
import Moment from "moment";
import * as Path from "path";

import "./Config";
import * as Result from "./Result";
import * as Time from "./Schema/Time";
import * as Toggl from "./Toggl";
import * as Utility from "./Utility";

const MAGIC_START = Moment("2018-06-22T13:10:55+00:00");
const DATA_DIR = Path.join(__dirname, "../data");
const BACKUP_DIR = `${DATA_DIR}/backup`;

// Convert entries to CSV format so they can be imported by calendar apps
const entriesToCsv = (entries: Toggl.Entry[]): Result.Result<string> => {
  if (entries.length <= 0) {
    return Result.error("At least one time entry is needed to create a CSV");
  }

  const items = entries.map(entry => {
    const start = Moment(entry.start);
    const stop = Moment(entry.stop);
    return {
      Subject: entry.description,
      "Start Date": start.format("MM/DD/YYYY"),
      "Start Time": start.format("hh:mm A"),
      "End Date": stop.format("MM/DD/YYYY"),
      "End Time": stop.format("hh:mm A"),
      "All Day Event": false,
      Description: entry.tags ? entry.tags.join(" ") : "",
      Location: "",
      Private: true
    };
  });

  const headers = Object.keys(items[0]).join(",");
  const rows = items.map(item => Object.values(item).join(",")).join("\n");
  return Result.success(`${headers}\n${rows}`);
};

// Write a text file
const save = (filePath: string, contents: string): void => {
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

  const entries = (await Toggl.getEntriesFromTime(
    Time.ongoingInterval(MAGIC_START)
  )).getOrElseL(Utility.throwError);

  const csv = entriesToCsv(entries).getOrElseL(Utility.throwError);

  saveJson(`toggl/entries.json`, entries);
  save(`toggl/entries.csv`, csv);

  // Save the Toggl and Magic versions of every tag

  const togglTags = (await Toggl.getTags()).getOrElseL(Utility.throwError);
  const magicTags = (await Firebase.firestore()
    .collection("tags")
    .get()).docs.reduce((previous, document) => {
    const data = document.data();

    if (data.connections) {
      data.connections = data.connections.map(
        (connection: Firestore.DocumentReference) => connection.id
      );
    }

    return {
      ...previous,
      [document.id]: data
    };
  }, {});

  saveJson(`toggl/tags.json`, togglTags);
  saveJson(`magic/tags.json`, magicTags);

  process.exit(0);
})();
