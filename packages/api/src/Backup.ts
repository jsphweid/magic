import Firebase from "firebase";
import * as FS from "fs";
import Moment from "moment";
import * as Path from "path";

import "./Config";
import * as Toggl from "./Toggl";
import * as Utility from "./Utility";

const DATA_DIR = Path.join(__dirname, "../data");
const BACKUP_DIR = `${DATA_DIR}/backup`;

Firebase.initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
});

const db = Firebase.firestore();
db.settings({ timestampsInSnapshots: true });

const saveJson = (filePath: string, contents: object): void => {
  const backupPath = `${BACKUP_DIR}/${filePath}`;
  FS.writeFileSync(backupPath, JSON.stringify(contents, null, 2));

  // tslint:disable-next-line:no-console
  console.log(`Saved \`${backupPath}\``);
};

(async () => {
  if (__dirname.includes("functions")) return;

  // Save the Toggl and Magic versions of every tag

  const magicTags: { [id: string]: any } = {};
  (await db.collection("tags").get()).forEach(document => {
    const data = document.data();
    if (data.connections) {
      data.connections = data.connections.map(
        (connection: any) => connection.id
      );
    }

    magicTags[document.id] = data;
  });

  saveJson(`magic/tags.json`, magicTags);

  const { value: togglTags } = (await Toggl.getTags()).mapLeft(
    Utility.throwError
  );

  saveJson(`toggl/tags.json`, togglTags);

  // Save every entry since tracking began

  const { value: entries } = (await Toggl.Entry.getInterval(
    Moment("2018-06-22T13:10:55+00:00"),
    Moment()
  )).mapLeft(Utility.throwError);

  saveJson(`toggl/time-entries.json`, entries);

  process.exit(0);
})();
