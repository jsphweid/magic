import { either as Either, option as Option } from "fp-ts";
import gql from "graphql-tag";
import Moment from "moment";

import * as Toggl from "../../Toggl";
import * as Utility from "../../Utility";
import * as Time from "../Time";

export const schema = gql`
  type Mutation {
    setTime(start: Date, stop: Date, narrative: String, tags: [String!]): Time!
  }
`;

export interface Args {
  start: Moment.Moment | null;
  stop: Moment.Moment | null;
  narrative: string | null;
  tags: string[] | null;
}

export const resolve = {
  setTime: async (_source: undefined, args: Args): Promise<Time.Source> => {
    // const tags = Option.fromNullable(args.tags)
    //   .getOrElse([])
    //   .map(tagName =>
    //     Tag.resolve(Tag.sourceFromName(tagName).getOrElseL(Utility.throwError))
    //   );

    const now = Moment();

    const newEntryStart = Option.fromNullable(args.start).getOrElse(now);
    const newEntryStop = Option.fromNullable(args.stop).getOrElse(now);

    const newEntryStartMS = newEntryStart.valueOf();
    const newEntryStopMS = newEntryStop.valueOf();

    const newEntry = {
      pid: Option.none,
      description: Option.fromNullable(args.narrative),
      tags: Option.fromNullable(args.tags)
    };

    // Grab the entries we might affect
    const { value: entries } = (await Toggl.Entry.getInterval(
      newEntryStart,
      newEntryStop
    )).mapLeft(Utility.throwError);

    // Get the value of the new entry after it is either created or started
    const { value: entry } = (args.stop
      ? await Toggl.Entry.POST(newEntryStart, newEntryStop, newEntry)
      : await startCurrentEntry(now, newEntryStart, newEntry)
    ).mapLeft(Utility.throwError);

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
        newEntryStartMS <= oldEntryStartMS &&
        oldEntryStopMS <= newEntryStopMS
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
          Toggl.Entry.POST(oldEntryStart, newEntryStart, {
            pid: Option.fromNullable(oldEntry.pid),
            description: Option.fromNullable(oldEntry.description),
            tags: Option.fromNullable(oldEntry.tags)
          }),
          Toggl.Entry.PUT({
            ...oldEntry,
            start: newEntryStop.toISOString()
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
        newEntryStartMS < oldEntryStopMS
      ) {
        (await Toggl.Entry.PUT({
          ...oldEntry,
          stop: newEntryStart.toISOString()
        })).mapLeft(Utility.throwError);
      } else if (
        /*
          New:      |===============|
          Old:            |-----------------|
          
          Trim the start of the old entry

          Result:   |===============||------|
        */
        newEntryStartMS < oldEntryStartMS &&
        oldEntryStartMS < newEntryStopMS
      ) {
        (await Toggl.Entry.PUT({
          ...oldEntry,
          start: newEntryStop.toISOString()
        })).mapLeft(Utility.throwError);
      }
    }

    return Time.source(
      Option.fromNullable(args.start),
      Option.fromNullable(args.stop)
    );
  }
};

const startCurrentEntry = async (
  now: Moment.Moment,
  start: Moment.Moment,
  newEntry: Toggl.Entry.NewEntry
): Promise<Either.Either<Error, Toggl.Entry.Entry>> =>
  (await Toggl.Entry.getCurrentEntry()).fold(
    Utility.throwError,
    async currentEntry => {
      // If there is an existing current entry, stop it
      currentEntry.map(async currentEntry => {
        (await Toggl.Entry.stop(currentEntry)).getOrElseL(Utility.throwError);

        /*
          If we're starting the current time entry in the future, the old
          entry's stop needs to be set to the new entry's start
        */
        if (now.valueOf() < start.valueOf()) {
          (await Toggl.Entry.PUT({
            ...currentEntry,
            stop: start.toISOString()
          })).getOrElseL(Utility.throwError);
        }
      });

      // Start the new entry
      return Toggl.Entry.start(start, newEntry);
    }
  );

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
