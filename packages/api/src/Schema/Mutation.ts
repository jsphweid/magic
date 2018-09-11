import gql from "graphql-tag";
import Moment from "moment";

import { either as Either, option as Option } from "fp-ts";

import * as Toggl from "~/toggl";
import { Tag, Interval } from "~/time";

import * as Query from "./Query";
import { Source as TimeSource } from "./Time";

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

interface Args {
  start: Moment.Moment | null;
  stop: Moment.Moment | null;
  narrative: string | null;
  tags: string[] | null;
}

export const resolve = {
  startTime: async (_source: undefined, args: Args): Promise<TimeSource> => {
    const interval = {
      start: args.start || Moment(),
      stop: args.stop
    };

    /*
      Join every potential tag as string with the format
      "lowercase-and-hyphenated" it can be easily searched

      e.g. "browsing-education-getting-ready"
    */
    const allTagPossibleTagNames = `-${[
      args.narrative ? Tag.stringToName(args.narrative) : "",
      args.tags ? args.tags.map(name => Tag.stringToName(name)).join("-") : ""
    ].join("-")}-`;

    /*
      If the tag isn't explicitly excluded (i.e. "not-browsing" will prevent the
      "browsing" tag from being used) and exists in storage, add it to the final
      list...

      Also, tags with "multiple-words" will be added if the first word is found
    */
    const finalTagNames = Tag.all
      .filter(({ name }) => {
        const paddedName = `-${name}-`;
        return (
          !allTagPossibleTagNames.includes(`-not${paddedName}`) &&
          (allTagPossibleTagNames.includes(paddedName) ||
            allTagPossibleTagNames.includes(`-${name.split("-")[0]}-`))
        );
      })
      .map(({ name }) => name);

    /*
      If the name of any tag or its connections is the same as a project, add
      the project's id to the new time entry
    */
    const { value: project } = await projectFromTagNames(finalTagNames);
    if (project instanceof Error) {
      throw project;
    }

    const newTimeEntry = {
      pid: project.map(({ id }) => id).toUndefined(),
      description: args.narrative || undefined,
      tags: finalTagNames
    };

    // Create a time entry if it's completed, otherwise start one in-progress
    const { value: timeEntry } = Interval.isStopped(interval)
      ? await Toggl.TimeEntry.post(interval, newTimeEntry)
      : await Toggl.TimeEntry.start(newTimeEntry);

    if (timeEntry instanceof Error) {
      throw timeEntry;
    }

    /*
      If we created an active interval and a start time was provided, update the
      running time entry with the right start time
    */
    if (args.start && !Interval.isStopped(interval)) {
      const { value: updatedTimeEntry } = await Toggl.TimeEntry.put({
        start: interval.start.toISOString(),
        ...timeEntry
      });

      if (updatedTimeEntry instanceof Error) {
        throw updatedTimeEntry;
      }
    }

    // Return the current state of `Time` in Magic for the target interval
    return Query.resolve.time(undefined, {
      start: args.start,
      stop: args.stop
    });
  }
};

/*
  If any of the tags or their connections has a name which matches a project,
  return that match. This is primarily used to get the nice colored timeline
  view in Toggl's web interface.
*/
const projectFromTagNames = async (
  tagNames: string[]
): Promise<Either.Either<Error, Option.Option<Toggl.Project>>> =>
  (await Toggl.getProjects()).chain(projects => {
    // Get the data for every tag and their connections
    const expandedTagNames = Tag.allFromNames(tagNames).map(({ name }) => name);
    return Either.right(
      Option.fromNullable(
        projects.find(({ name }) => expandedTagNames.includes(name))
      )
    );
  });
