import { either as Either, option as Option } from "fp-ts";
import * as GraphQL from "graphql";
import gql from "graphql-tag";
import Moment from "moment";

import * as Toggl from "../Toggl";
import * as Utility from "../Utility";
import * as Context from "./Context";
import * as Node from "./Node";
import * as Tag from "./Tag";
import * as Time from "./Time";

export const schema = gql`
  type Narrative implements Node__Identifiable & Node__Persisted & Time__Timed & Tag__Tagged {
    ID: ID!
    metadata: Node__PersistenceMetadata!
    time: Time!
    description: String!
    tags: [Tag!]!
  }

  type Narrative__Query {
    narratives(
      search: String
      time: Time__Selection
      tags: Tag__Selection
    ): [Narrative!]!
  }

  type Narrative__Mutation {
    new(narrative: Narrative__New!): Narrative!
  }

  input Narrative__New {
    time: Time__Selection!
    description: String
    tags: Tag__Selection
  }
`;

export interface Narrative
  extends Node.Identifiable,
    Node.Persisted,
    Time.Timed,
    Tag.Tagged {
  ID: string;
  time: Time.Time;
  description: string;
}

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
        time: Time.SelectionGraphQLArgs | null;
        tags: Tag.SelectionGraphQLArgs | null;
      }
    ) => []
  },

  Narrative__Mutation: {
    new: async (
      _: undefined,
      args: {
        narrative: {
          time: Time.SelectionGraphQLArgs;
          tags: Tag.SelectionGraphQLArgs | null;
          description: string | null;
        };
      },
      context: Context.Context
    ): Promise<Narrative> => {
      const selection = {
        time: Time.selectionFromGraphQLArgs(args.narrative.time).getOrElseL(
          Utility.throwError
        ),
        tags: Tag.selectionFromGraphQLArgs(args.narrative.tags).getOrElseL(
          Utility.throwError
        )
      };

      const tagsToFind = [
        ...selection.tags.include.names,
        ...Option.fromNullable(args.narrative.description)
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

      const newEntryStart = selection.time.start.getOrElse(now);
      const newEntryStop = selection.time.stop.getOrElse(now);

      // Protect against mass data-deletion
      if (
        Time.stoppedInterval(newEntryStart, newEntryStop)
          .duration()
          .asHours() > 3
      ) {
        throw new GraphQL.GraphQLError(
          "You cannot select more than three hours"
        );
      }

      const newEntryStartMS = newEntryStart.valueOf();
      const newEntryStopMS = newEntryStop.valueOf();

      const newEntry = {
        pid: project.map(({ id }) => id),
        description: Option.fromNullable(args.narrative.description),
        tags: tags.map(({ name }) => name)
      };

      // Grab the entries we might affect
      const entries = (await Toggl.Entry.getInterval(
        Moment(newEntryStart).subtract(5, "hours"),
        newEntryStop
      )).getOrElseL(Utility.throwError);

      // Create or start a new entry depending on if a stop time was provided
      const { id: ID } = (selection.time.stop.isSome()
        ? await Toggl.Entry.POST(newEntryStart, newEntryStop, newEntry)
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
