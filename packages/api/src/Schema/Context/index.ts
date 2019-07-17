import Moment from "moment";

import * as Local from "../../Local";
import * as Archive from "./Archive";

export interface Context {
  now: Moment.Moment;
  archive: Archive.Archive;
}

export const context = async (): Promise<Context> => {
  const rawArchive = await Local.getMostRecentArchive();

  return { now: Moment(), archive: Archive.makeArchive(rawArchive) };
};
