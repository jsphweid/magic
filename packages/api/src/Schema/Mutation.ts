import { either as Either, option as Option } from "fp-ts";
import gql from "graphql-tag";
import Moment from "moment";

import * as Toggl from "../Toggl";
import * as Utility from "../Utility";
import * as Context from "./Context";
import * as History from "./History";
import * as Tag from "./Tag";
import * as Time from "./Time";

export const schema = gql`
  type Mutation {
    track(
      start: Date
      duration: Duration
      stop: Date
      narrative: String
      tags: [String!]
    ): History!
  }
`;

export const resolve = {
  track: async (
    _source: undefined,
    args: Time.SelectionGraphQLArgs & {
      narrative: string | null;
      tags: string[] | null;
    },
    context: Context.Context
  ): Promise<History.History> => {
    const selection = Time.selectionFromGraphQLArgs(args).getOrElseL(
      Utility.throwError
    );

    const tagsToFind = [
      ...Option.fromNullable(args.tags).getOrElse([]),
      ...Option.fromNullable(args.narrative)
        .map(narrative => [narrative])
        .getOrElse([])
    ];

    const tags = (await Tag.findMatches(
      context,
      tagsToFind.join(" ")
    )).getOrElseL(Utility.throwError);

    const project = (await projectFromTags(tags)).getOrElseL(
      Utility.throwError
    );

    const now = Moment();

    const newEntryStart = selection.start.getOrElse(now);
    const newEntryStop = selection.stop.getOrElse(now);

    const newEntryStartMS = newEntryStart.valueOf();
    const newEntryStopMS = newEntryStop.valueOf();

    const newEntry = {
      pid: project.map(({ id }) => id),
      description: Option.fromNullable(args.narrative),
      tags: tags.map(({ name }) => name)
    };

    // (await Promise.all(newEntry.tags.map(_.curry(Tag.updateLastOccurrence)(context))))

    // Grab the entries we might affect
    const { value: entries } = (await Toggl.Entry.getInterval(
      Moment(newEntryStart).subtract(5, "hours"),
      newEntryStop
    )).mapLeft(Utility.throwError);

    console.log(selection);

    // Create or start a new entry depending on if a stop time was provided
    (selection.stop
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

          Action: Delete the old entry

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
          
          Action: Split the old entry

          Result:   |----||=====||----|
        */
        oldEntryStartMS < newEntryStartMS &&
        newEntryStopMS < oldEntryStopMS
      ) {
        (await Promise.all([
          Toggl.Entry.POST(oldEntryStart, newEntryStart, {
            pid: Option.fromNullable(oldEntry.pid),
            description: Option.fromNullable(oldEntry.description),
            tags: Option.fromNullable(oldEntry.tags).getOrElse([])
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
          
          Action: Trim the end of the old entry

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
          
          Action: Trim the start of the old entry

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

    return History.getFromTimeSelection(context, selection);
  }
};

const startCurrentEntry = async (
  now: Time.Date,
  start: Time.Date,
  newEntry: Toggl.Entry.NewEntry
): Promise<Either.Either<Error, Toggl.Entry.Entry>> =>
  (await Toggl.Entry.getCurrentEntry()).fold(
    Utility.throwError,
    async oldCurrentEntry => {
      // If there is an existing current entry, stop it
      oldCurrentEntry.map(async oldCurrentEntry => {
        (await Toggl.Entry.stop(oldCurrentEntry)).getOrElseL(
          Utility.throwError
        );

        /*
          If we're starting the current time entry in the future, the old
          entry's stop needs to be set to the new entry's start
        */
        if (now.valueOf() < start.valueOf()) {
          (await Toggl.Entry.PUT({
            ...oldCurrentEntry,
            stop: start.toISOString()
          })).getOrElseL(Utility.throwError);
        }
      });

      // Start the new entry
      const currentEntry = await Toggl.Entry.start(newEntry);

      // If the current entry starts now, we're done, otherwise update the start
      return start === now
        ? currentEntry
        : Toggl.Entry.PUT({
            ...currentEntry.getOrElseL(Utility.throwError),
            start: start.toISOString()
          });
    }
  );

/*
  If any of the tags or their connections has a name which matches a project,
  return that match. This is primarily used to get the nice colored timeline
  view in Toggl's web interface.
*/
const projectFromTags = async (
  tags: Tag.Tag[]
): Promise<Either.Either<Error, Option.Option<Toggl.Project>>> =>
  (await Toggl.getProjects()).map(projects =>
    Option.fromNullable(
      projects.find(({ name }) => tags.map(({ name }) => name).includes(name))
    )
  );
