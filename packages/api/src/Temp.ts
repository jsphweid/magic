import * as FS from "fs";
import * as Path from "path";

import * as Local from "./Local";
import { makeRandomUniqueID } from "./Utility";

const getJSON = (backupPath: string) =>
  JSON.parse(
    FS.readFileSync(
      Path.resolve(Path.join(__dirname, "..", "data/backup", backupPath)),
      "utf8"
    )
  );

const originalTagsJSON = getJSON("/magic/tags.json");

const _tags = Object.entries(originalTagsJSON).map(([legacyID, item]: any) => ({
  name: item.name,
  id: makeRandomUniqueID(),
  legacyConnections: item.connections,
  legacyID,
  aliases: item.aliases
}));

const mapping = _tags.reduce(
  (previous: any, current: any) => ({
    ...previous,
    [current.legacyID]: current.id
  }),
  {}
);

const tags = _tags.map(tag => ({
  name: tag.name,
  id: tag.id,
  aliases: tag.aliases,
  connections: tag.legacyConnections.map((c: any) => mapping[c])
}));

const entries: any = getJSON("/toggl/entries.json").map((entry: any) => ({
  start: new Date(entry.start).getTime(),
  end: entry.stop ? new Date(entry.stop).getTime() : undefined,
  tags: [],
  description: entry.description
}));

Local.saveNewArchive({ tags, entries });
