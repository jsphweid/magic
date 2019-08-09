import Moment from "moment";

import * as Archive from "../../../raw-archive/src";

import * as Local from "../Local";

export interface Context {
  now: Moment.Moment;
  archive: Archive.Archive;
}

export const context = async (): Promise<Context> => {
  const rawArchive = await Local.getMostRecentArchive();

  return { now: Moment(), archive: Archive.makeArchive(rawArchive) };
};
