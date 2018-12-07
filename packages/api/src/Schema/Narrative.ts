import { either as Either, option as Option } from "fp-ts";
import * as GraphQL from "graphql";
import gql from "graphql-tag";
import Moment from "moment";

import * as Result from "../Result";
import * as Toggl from "../Toggl";
import * as Utility from "../Utility";
import * as Context from "./Context";
import * as Node from "./Node";
import * as Tag from "./Tag";
import * as Time from "./Time";

export const schema = gql`
  type Narrative implements Node__Identifiable & Node__Persisted & Time__Timed & Tag__Tagged {
    ID: ID!
    metadata: Node__Metadata!
    time: Time!
    tags: [Tag!]!
    description: String!
  }

  type Narrative__Query {
    narratives(
      search: String
      time: Time__Selection
      tags: Tag__Filter
    ): [Narrative!]!
  }

  type Narrative__Mutation {
    new(
      description: String
      time: Time__Selection
      tags: Tag__Selection
    ): Narrative!
  }
`;

export interface Narrative
  extends Node.Identifiable,
    Node.Persisted,
    Time.Timed,
    Tag.Tagged {
  description: string;
}

export const fromTogglEntry = async (
  context: Context.Context,
  entry: Toggl.Entry.Entry
): Promise<Result.Result<Narrative>> =>
  (await Tag.getAllFromNames(context, entry.tags || [])).map(tags => {
    const description = entry.description || descriptionFromTags(tags);
    const start = Moment(entry.start);
    const time = entry.stop
      ? Time.stoppedInterval(start, Moment(entry.stop))
      : Time.ongoingInterval(start);

    const ID = `${entry.id}`;
    const metadata = {
      created: start,
      updated: Moment(entry.at)
    };

    return { ID, metadata, time, description, tags };
  });

export const descriptionFromTags = (tags: Tag.Tag[]): string =>
  tags.reduce((previous, tag, i) => {
    const name = tag.name.replace(/-/g, " ");
    if (i === 0) return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
    if (i === 1 && tags.length === 1) return `${previous} and ${name}`;
    if (i === tags.length - 1) return `${previous}, and ${name}`;
    return `${previous}, ${name}`;
  }, "");

export const resolvers = {
  Narrative__Query: {
    narratives: (
      _: undefined,
      _args: {
        time?: Time.Selection;
        tags?: Tag.Selection;
      }
    ) => []
  },

  Narrative__Mutation: {
    new: async (
      _: undefined,
      args: {
        description?: string;
        time?: Time.Selection;
        tags?: Tag.Filter;
      },
      context: Context.Context
    ): Promise<Narrative> => {
      const tagsFilter = Tag.defaultFilter(args.tags).getOrElseL(
        Utility.throwError
      );

      const time = args.time
        ? Time.fromSelection(args.time)
        : Time.ongoingInterval();

      const tagNamesToMatch = [
        ...tagsFilter.include.names,
        ...(args.description ? [args.description] : [])
      ];

      const tags = (await Tag.findMatches(
        context,
        tagNamesToMatch.join(" ")
      )).getOrElseL(Utility.throwError);

      const project = (await projectFromTags(tags)).getOrElseL(
        Utility.throwError
      );

      // Protect against mass data-deletion
      if (Time.duration(Time.toStoppedInterval(time)).asHours() > 3) {
        throw new GraphQL.GraphQLError(
          "You cannot select more than three hours"
        );
      }

      const newEntryStartMS = time.start.valueOf();
      const newEntryStopMS = Time.toStoppedInterval(time).stop.valueOf();

      const newEntry = {
        pid: project.map(({ id }) => id),
        description: Option.fromNullable(args.description),
        tags: tags.map(({ name }) => name)
      };

      // Grab the entries we might affect
      const entries = (await Toggl.Entry.getInterval(
        Moment(time.start).subtract(5, "hours"),
        Time.toStoppedInterval(time).stop
      )).getOrElseL(Utility.throwError);

      // Create or start a new entry depending on if a stop time was provided
      const { id: ID } = (Time.isStoppedInterval(time)
        ? await Toggl.Entry.POST(time.start, time.stop, newEntry)
        : await startCurrentEntry(now, newEntryStart, newEntry)
      ).getOrElseL(Utility.throwError);

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

      return {
        ID,
        time,
        description,
        tags
      };
    }
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
