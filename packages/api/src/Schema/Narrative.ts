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
    time: Time__Time!
    tags: [Tag__Tag!]!
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
      tags: Tag__Filter
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
  entry: Toggl.Entry
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
        time: Time.Selection;
        tags: DeepPartial<Tag.Filter>;
      }
    ) => []
  },

  Narrative__Mutation: {
    new: async (
      _: undefined,
      args: {
        description?: string;
        time: Time.Selection;
        tags: DeepPartial<Tag.Filter>;
      },
      context: Context.Context
    ): Promise<Narrative> => {
      const tagsFilter = Tag.defaultFilter(args.tags).getOrElseL(
        Utility.throwError
      );

      const time = args.time
        ? Time.fromSelection(args.time)
        : Time.ongoingInterval();

      console.log([
        tagsFilter.include.names,
        args.description ? [args.description] : []
      ]);

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
        Utility.throwError(
          new GraphQL.GraphQLError("You cannot select more than three hours")
        );
      }

      const newEntryStartMS = time.start.valueOf();
      const newEntryStopMS = Time.toStoppedInterval(time).stop.valueOf();
      const newEntry = {
        pid: project && project.id,
        description: args.description,
        tags: tags.map(({ name }) => name)
      };

      // Grab the entries we might affect
      const start = Moment(time.start).subtract(5, "hours");
      const entries = (await Toggl.getEntriesFromTime(
        Time.isStoppedInterval(time)
          ? Time.stoppedInterval(start, time.stop)
          : Time.stoppedInterval(start)
      )).getOrElseL(Utility.throwError);

      // Create or start a new entry depending on if a stop time was provided
      const { id } = (Time.isStoppedInterval(time)
        ? await Toggl.postEntry(time.start, time.stop, newEntry)
        : await startCurrentEntry(context.now, time.start, newEntry)
      ).getOrElseL(Utility.throwError);

      for (const oldEntry of entries) {
        const oldEntryStart = Moment(oldEntry.start);
        const oldEntryStop = Option.fromNullable(oldEntry.stop)
          .map(stop => Moment(stop))
          .getOrElse(context.now);

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
          (await Toggl.deleteEntry(oldEntry)).mapLeft(Utility.throwError);
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
            Toggl.postEntry(oldEntryStart, time.start, oldEntry),
            Toggl.putEntry({
              ...oldEntry,
              start: Time.toStoppedInterval(time).stop.toISOString()
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
          (await Toggl.putEntry({
            ...oldEntry,
            stop: time.start.toISOString()
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
          (await Toggl.putEntry({
            ...oldEntry,
            start: time.start.toISOString()
          })).mapLeft(Utility.throwError);
        }
      }

      const metadata = { created: context.now, updated: context.now };
      return {
        ID: `${id}`,
        metadata,
        time,
        description: args.description || "TODO",
        tags
      };
    }
  }
};

const startCurrentEntry = async (
  now: Time.Date,
  start: Time.Date,
  newEntry: Toggl.NewEntry
): Promise<Result.Result<Toggl.Entry>> =>
  (await Toggl.getOngoingEntry()).fold(
    Utility.throwError,
    async ongoingEntry => {
      // If there is an existing current entry, stop it
      ongoingEntry.map(async ongoingEntry => {
        (await Toggl.stopEntry(ongoingEntry)).getOrElseL(Utility.throwError);

        /*
          If we're starting the current time entry in the future, the old
          entry's stop needs to be set to the new entry's start
        */
        if (now.valueOf() < start.valueOf()) {
          (await Toggl.putEntry({
            ...ongoingEntry,
            stop: start.toISOString()
          })).getOrElseL(Utility.throwError);
        }
      });

      // Start the new entry
      const currentEntry = await Toggl.startEntry(newEntry);

      // If the current entry starts now, we're done, otherwise update the start
      return start === now
        ? currentEntry
        : Toggl.putEntry({
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
): Promise<Either.Either<Error, Toggl.Project | undefined>> =>
  (await Toggl.getProjects()).map(projects =>
    projects.find(({ name }) => tags.map(({ name }) => name).includes(name))
  );
