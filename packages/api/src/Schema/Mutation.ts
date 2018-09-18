import { option as Option } from "fp-ts";

import gql from "graphql-tag";
import Moment from "moment";

import * as Utility from "../Utility";
import * as Toggl from "../Toggl";
// import * as Tag from "./Tag";
import * as Time from "./Time";

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
    const start = Option.fromNullable(args.start);
    const stop = Option.fromNullable(args.stop);

    const newEntry = {
      pid: Option.none,
      description: Option.fromNullable(args.narrative),
      tags: Option.fromNullable(args.tags)
    };

    const { value: entry } = (await stop
      .map(stop =>
        Toggl.Entry.post(start.getOrElseL(() => Moment()), stop, newEntry)
      )
      .getOrElseL(() => Toggl.Entry.start(start, newEntry))).mapLeft(
      Utility.throwError
    );

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
