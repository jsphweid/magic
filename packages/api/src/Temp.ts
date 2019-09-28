import { pipe, TaskEither } from "@grapheng/prelude";
import * as FS from "fs";
import * as Path from "path";

import { RawNarrative } from "~/raw-archive";
import * as Local from "./ArchiveStorage/Local";
import { makeRandomUniqueID } from "./Utility";

const getJSON = (backupPath: string) =>
  JSON.parse(
    FS.readFileSync(
      Path.resolve(Path.join(__dirname, "..", "data/backup", backupPath)),
      "utf8"
    )
  );

// const originalTagsJSON = getJSON("/magic/tags.json");

const tags: any[] = []; // originalTagsJSON
// ? Object.entries(originalTagsJSON).map(([legacyID, item]: any) => ({
//     name: item.name,
//     id: makeRandomUniqueID(),
//     legacyConnections: item.connections,
//     legacyID,
//     aliases: item.aliases
//   }))
// : [];

// const mapping = _tags.reduce(
//   (previous: any, current: any) => ({
//     ...previous,
//     [current.legacyID]: current.id
//   }),
//   {}
// );

// const tags = _tags.map(tag => ({
//   name: tag.name,
//   id: tag.id,
//   aliases: tag.aliases,
//   connections: tag.legacyConnections.map((c: any) => mapping[c])
// }));

interface RawTogglEntry {
  id: number;
  guid: string;
  wid: number;
  billable: boolean;
  start: string;
  stop?: string;
  duration: number;
  description: string;
  duronly: boolean;
  at: string;
  uid: number;
}

const narratives: RawNarrative[] = getJSON("/toggl/entries.json").map(
  (entry: RawTogglEntry) => ({
    id: makeRandomUniqueID(),
    start: new Date(entry.start).getTime(),
    stop: entry.stop ? new Date(entry.stop).getTime() : undefined,
    tags: [],
    meta: {
      created: new Date(entry.start).getTime(),
      updated: new Date(entry.at).getTime()
    },
    description: entry.description || `[unknown]`
  })
);

pipe(
  Local.archiveStorage.writeNew({ tags, narratives }),
  TaskEither.runUnsafe
);
