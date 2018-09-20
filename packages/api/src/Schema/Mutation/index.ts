import { option as Option } from "fp-ts";

import gql from "graphql-tag";
import Moment from "moment";

import * as Utility from "../../Utility";
import * as Toggl from "../../Toggl";
import * as Time from "../Time";

export const schema = gql`
  type Mutation {
    startTime(
      start: Date
      stop: Date
      narrative: String
      tags: [String!]
    ): Time!
  }
`;

export interface Args {
  start: Moment.Moment | null;
  stop: Moment.Moment | null;
  narrative: string | null;
  tags: string[] | null;
}

export const resolve = {
  startTime: async (_source: undefined, args: Args): Promise<Time.Source> => {
    const now = Moment();
    const start = Option.fromNullable(args.start).getOrElse(now);
    const stop = Option.fromNullable(args.stop);

    const newEntry = {
      pid: Option.none,
      description: Option.fromNullable(args.narrative),
      tags: Option.fromNullable(args.tags)
    };

    const { value: entry } = (await stop
      .map(stop => Toggl.Entry.POST(start, stop, newEntry))
      .getOrElseL(() => Toggl.Entry.start(start, newEntry))).mapLeft(
      Utility.throwError
    );

    const { value: entries } = (await Toggl.Entry.getInterval(
      start,
      stop.getOrElse(now)
    )).mapLeft(Utility.throwError);

    const newEntryStartMS = start.valueOf();
    const newEntryStopMS = stop.getOrElse(now).valueOf();

    for (const oldEntry of entries) {
      const oldEntryStart = Moment(oldEntry.start);
      const oldEntryStop = Option.fromNullable(oldEntry.stop)
        .map(stop => Moment(stop))
        .getOrElse(now);

      const oldEntryStartMS = oldEntryStart.valueOf();
      const oldEntryStopMS = oldEntryStop.valueOf();

      if (
        /*
          New:      |=================|
          Old:            |------|

          Delete the old entry

          Result:   |=================|
        */
        newEntryStartMS < oldEntryStartMS &&
        oldEntryStopMS < newEntryStopMS
      ) {
        (await Toggl.Entry.DELETE(oldEntry)).mapLeft(Utility.throwError);
      } else if (
        /*
          New:            |=====|
          Old:      |-----------------|
          
          Split the old entry

          Result:   |----||=====||----|
        */
        oldEntryStartMS < newEntryStartMS &&
        newEntryStopMS < oldEntryStopMS
      ) {
        (await Promise.all([
          Toggl.Entry.PUT({
            ...oldEntry,
            stop: start.toISOString()
          }),
          Toggl.Entry.POST(oldEntryStart, oldEntryStop, {
            pid: Option.fromNullable(oldEntry.pid),
            description: Option.fromNullable(oldEntry.description),
            tags: Option.fromNullable(oldEntry.tags)
          })
        ])).map(result => result.mapLeft(Utility.throwError));
      } else if (
        /*
          New:            |===============|
          Old:      |-----------------|
          
          Trim the end of the old entry

          Result:   |----||===============|
        */
        oldEntryStartMS < newEntryStartMS &&
        oldEntryStopMS < newEntryStopMS
      ) {
        (await Toggl.Entry.PUT({
          ...oldEntry,
          stop: start.toISOString()
        })).mapLeft(Utility.throwError);
      } else if (
        /*
          New:      |===============|
          Old:            |-----------------|
          
          Trim the start of the old entry

          Result:   |===============||------|
        */
        newEntryStartMS < oldEntryStartMS &&
        newEntryStopMS < oldEntryStopMS
      ) {
        (await Toggl.Entry.PUT({
          ...oldEntry,
          start: stop.getOrElse(now).toISOString()
        })).mapLeft(Utility.throwError);
      }
    }

    return Time.source(
      Option.fromNullable(args.start),
      Option.fromNullable(args.stop)
    );
  }
};

// /*
//   If any of the tags or their connections has a name which matches a project,
//   return that match. This is primarily used to get the nice colored timeline
//   view in Toggl's web interface.
// */
// const projectFromTags = async (
//   tagNames: string[]
// ): Promise<Either.Either<Error, Option.Option<Toggl.Project>>> =>
//   (await Toggl.getProjects()).chain(projects => {
//     // Get the data for every tag and their connections
//     const expandedTagNames = Tag.allFromNames(tagNames).map(({ name }) => name);
//     return Either.right(
//       Option.fromNullable(
//         projects.find(({ name }) => expandedTagNames.includes(name))
//       )
//     );
//   });
