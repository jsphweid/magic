import * as Firebase from "firebase";
import * as FirebaseAdmin from "firebase-admin";
import * as Functions from "firebase-functions";
import { option as Option } from "fp-ts";
import * as FS from "fs";
import * as Path from "path";

import * as Utility from "./Utility";

const ENVIRONMENT_JSON_PATH = Path.join(__dirname, "../data/environment.json");
const REQUIRED_ENVIRONMENT_VARIABLES = [
  "MAGIC_API_TOKEN",
  "MAGIC_TIME_ZONE",

  "TOGGL_WORKSPACE_ID",
  "TOGGL_TOKEN",

  "TWILIO_NUMBERS_OWNER",

  "IFTTT_KEY",

  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_DATABASE_URL",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID"
];

if (process.env.NODE_ENV === "production") {
  const config = Functions.config();
  process.env = {
    ...process.env,
    MAGIC_API_TOKEN: config.api.token,
    MAGIC_TIME_ZONE: config.time.zone,

    TOGGL_TOKEN: config.toggl.token,
    TOGGL_WORKSPACE_ID: config.toggl.workspace_id,

    TWILIO_NUMBERS_OWNER: config.twilio.numbers.owner,

    IFTTT_KEY: config.ifttt.key
  };

  const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG as any);

  FirebaseAdmin.initializeApp(firebaseConfig);
  Firebase.initializeApp(firebaseConfig);
  Firebase.firestore().settings({
    timestampsInSnapshots: true
  });
} else if (!__dirname.includes("functions")) {
  process.env = {
    ...process.env,
    ...JSON.parse(FS.readFileSync(ENVIRONMENT_JSON_PATH).toString())
  };

  REQUIRED_ENVIRONMENT_VARIABLES.forEach(variableName =>
    Option.fromNullable(process.env[variableName]).getOrElseL(() =>
      Utility.throwError(
        new Error(`\`${variableName}\` is missing from the environment!`)
      )
    )
  );

  Firebase.initializeApp({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
  });

  Firebase.firestore().settings({
    timestampsInSnapshots: true
  });
}
