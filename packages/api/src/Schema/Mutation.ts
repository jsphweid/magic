import { option as Option } from "fp-ts";

import gql from "graphql-tag";
import Moment from "moment";

import * as Utility from "../Utility";
import * as Toggl from "../Toggl";
// import * as Tag from "./Tag";
import * as Time from "./Time";
import { fromNullable } from "fp-ts/lib/Option";

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

    const start = Option.fromNullable(args.start);
    const stop = Option.fromNullable(args.stop);

    const newEntry = {
      pid: Option.none,
      description: Option.fromNullable(args.narrative),
      tags: Option.fromNullable(args.tags)
    };

    const { value: entries } = (await Toggl.Entry.getInterval(
      start.getOrElse(now),
      stop.getOrElse(now)
    )).mapLeft(Utility.throwError);

    const { value: entry } = (await stop
      .map(stop =>
        Toggl.Entry.post(start.getOrElseL(() => Moment()), stop, newEntry)
      )
      .getOrElseL(() => Toggl.Entry.start(start, newEntry))).mapLeft(
      Utility.throwError
    );

    for (const oldEntry of entries) {
      const oldEntryStart = Moment(oldEntry.start);
      const oldEntryStop = Option.fromNullable(oldEntry.stop)
        .map(stop => Moment(stop))
        .getOrElse(now);

      if (
        /*
          New:      |=================|
          Old:            |------|

          Delete the old entry

          Result:   |=================|
        */
        start.getOrElse(now).valueOf() < oldEntryStart.valueOf() &&
        oldEntryStop.valueOf() < stop.getOrElse(now).valueOf()
      ) {
        console.log(1);
        // (await Toggl.Entry.delete(oldEntry.id)).mapLeft(Utility.throwError);
      } else if (
        /*
          New:            |=====|
          Old:      |-----------------|
          
          Split the old entry

          Result:   |----||=====||----|
        */
        oldEntryStart.valueOf() < start.getOrElse(now).valueOf() &&
        stop.getOrElse(now).valueOf() < oldEntryStop.valueOf()
      ) {
        (await Promise.all([
          Toggl.Entry.put({
            ...oldEntry,
            stop: start.getOrElse(now).toISOString()
          }),
          Toggl.Entry.post(oldEntryStart, oldEntryStop, {
            pid: Option.fromNullable(oldEntry.pid),
            description: Option.fromNullable(oldEntry.description),
            tags: Option.fromNullable(oldEntry.tags)
          })
        ])).map(result => result.mapLeft(Utility.throwError));

        console.log(2);
      } else if (
        /*
          New:            |===============|
          Old:      |-----------------|
          
          Trim the end of the old entry

          Result:   |----||===============|
        */
        start.getOrElse(now).valueOf() < oldEntryStop.valueOf()
      ) {
        (await Toggl.Entry.put({
          ...oldEntry,
          stop: start.getOrElse(now).toISOString()
        })).mapLeft(Utility.throwError);

        console.log(3, entry);
      } else if (
        /*
          New:      |===============|
          Old:            |-----------------|
          
          Trim the start of the old entry

          Result:   |===============||------|
        */
        oldEntryStart.valueOf() < stop.getOrElse(now).valueOf()
      ) {
        (await Toggl.Entry.put({
          ...oldEntry,
          start: stop.getOrElse(now).toISOString()
        })).mapLeft(Utility.throwError);

        console.log(
          oldEntryStart.format("h:mm"),
          stop.getOrElse(now).format("h:mm")
        );

        console.log(4, entry);
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
