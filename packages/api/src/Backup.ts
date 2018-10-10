import * as FS from "fs";
import Moment from "moment";
import * as Path from "path";

import Firebase from "firebase";

import * as Toggl from "./Toggl";
import * as Utility from "./Utility";

const DATA_DIR = Path.join(__dirname, "../.data");
const BACKUP_DIR = `${DATA_DIR}/backup`;

Firebase.initializeApp({});

const db = Firebase.firestore();
db.settings({ timestampsInSnapshots: true });

const save = async () => {
  // Save the Toggl and Magic versions of every tag

  console.log(
    (await db.collection("tags").get()).docs.map(document => {
      const data = document.data();
      return {
        ...data,
        connections:
          data.connections &&
          data.connections.map((connection: any) => connection.id)
      };
    })
  );

  writeAsJSON(
    `${BACKUP_DIR}/magic/tags.json`,
    (await db.collection("tags").get()).docs.map(document => ({
      ...document.data(),
      connections: []
    }))
  );

  writeAsJSON(
    `${BACKUP_DIR}/toggl/tags.json`,
    (await Toggl.getTags()).mapLeft(Utility.throwError).value
  );

  // Save every entry since tracking began

  writeAsJSON(
    `${BACKUP_DIR}/toggl/time-entries.json`,
    (await Toggl.Entry.getInterval(
      Moment("2018-06-22T13:10:55+00:00"),
      Moment()
    )).mapLeft(Utility.throwError).value
  );
};

const writeAsJSON = (filePath: string, contents: object): void =>
  FS.writeFileSync(
    Path.resolve(__dirname, filePath),
    JSON.stringify(contents, null, 2)
  );

if (process.env.NODE_ENV !== "production" && !__dirname.includes("functions")) {
  save();
}
