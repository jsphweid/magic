import Firebase from "firebase";
import { option as Option } from "fp-ts";
import * as FS from "fs";
import Moment from "moment";
import * as Path from "path";

import "./Config";
import * as Time from "./Schema/Time";
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
  const entries: Toggl.Entry.Entry[] = JSON.parse(
    FS.readFileSync(`${BACKUP_DIR}/toggl/time-entries.json`).toString()
  );

  const rows = entries.map(entry => {
    const start = Moment(entry.start);
    return {
      Subject: entry.description,
      "Start Date": start.format("MM/DD/YYYY"),
      "Start Time": start.format("hh:mm A"),
      "End Date": start.format("MM/DD/YYYY"),
      "End Time": start.format("hh:mm A"),
      "All Day Event": false,
      Description: Option.fromNullable(entry.tags)
        .getOrElse([])
        .join(" "),
      Location: "",
      Private: true
    };
  });

  const csv = Option.fromNullable(entries[0]).fold(
    "",
    firstRow =>
      `${Object.keys(firstRow).join(" ")}\n${rows
        .map(row => Object.values(row).join(","))
        .join("\n")}`
  );

  console.log(csv);
})();

// Subject
// The name of the event, required.
// Example: Final exam
// Start Date
// The first day of the event, required.
// Example: 05/30/2020
// Start Time
// The time the event begins.
// Example: 10:00 AM
// End Date
// The last day of the event.
// Example: 05/30/2020
// End Time
// The time the event ends.
// Example: 1:00 PM
// All Day Event
// Whether the event is an all-day event. Enter True if it is an all-day event, and False if it isn't.
// Example: False
// Description
// Description or notes about the event.
// Example: 50 multiple choice questions and two essay questions
// Location
// The location for the event.
// Example: "Columbia, Schermerhorn 614"
// Private
// Whether the event should be marked private. Enter True if the event is private, and False if it isn't.
// Example: True

(async () => {
  return;

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
    (await Toggl.Timeline.getFromInterval(
      Time.stoppedInterval(Moment().subtract(2, "months"), Moment())
    )).getOrElseL(Utility.throwError)
  );

  process.exit(0);
})();
