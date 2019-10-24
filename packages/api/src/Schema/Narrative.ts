import { pipe } from "@grapheng/prelude";
import gql from "graphql-tag";
import Moment from "moment-timezone";

import { RawNarrative } from "~/raw-archive";
import { Narrative__QueryNarrativesArgs, Resolvers } from "../../GeneratedCode";
import { timeUnitToMoment } from "../Utility";
import * as Node from "./Node";
import * as Time from "./Time";

export const typeDefs = gql`
  type Narrative__Narrative implements Node__Identifiable & Node__Persisted & Time__Timed & Tag__Tagged {
    ID: ID!
    meta: Node__Meta!
    time: Time__Occurrence!
    tags: [Tag__Tag!]!
    description: String!
  }

  type Narrative__Query {
    narratives(
      search: String
      time: Time__Selection
      tags: Tag__Filter
    ): [Narrative__Narrative!]!
  }

  type Narrative__Mutation {
    new(
      description: String!
      time: Time__Selection
      tags: Tag__Filter
    ): Narrative__Narrative!
  }
`;

export interface Narrative
  extends Node.Identifiable,
    Node.Persisted,
    Time.Timed {
  description: string;
}

export const timeBasedFilter = (selection: any) => (narrative: RawNarrative) =>
  pipe(
    Time.fromSelection(timeUnitToMoment(selection)),
    timeSelection =>
      Time.isInterval(timeSelection)
        ? Time.instantIsInInterval(
            Time.instant(Moment(narrative.start)),
            timeSelection
          )
        : true
  );

export const stringBasedFilter = (str?: string | null) => (
  narrative: RawNarrative
) =>
  str ? narrative.description.toLowerCase().includes(str.toLowerCase()) : true;

export const filterNarratives = (args: Narrative__QueryNarrativesArgs) => (
  narrative: RawNarrative
) =>
  timeBasedFilter(args.time)(narrative) &&
  stringBasedFilter(args.search)(narrative);
// TODO: add tag based filter

export const resolvers: Resolvers = {
  Narrative__Query: {
    narratives: (_, args, context) =>
      context.archiveModel
        .getAllRawNarratives()
        .sort((a, b) => b.start - a.start)
        .filter(filterNarratives(args)) // how do you flow
  },
  Narrative__Narrative: {
    ID: source => source.id,
    time: source =>
      pipe(
        Time.fromSelection({
          start: Moment(source.start),
          stop: source.stop ? Moment(source.stop) : undefined
        })
      )
  }
  // Narrative__Mutation: {
  //   new: (_, args, context) =>
  //     pipe(
  //       context.archiveModel.createNewNarrative({
  //         description: args.description,
  //         timeSelection: args.time || null,
  //         tagsFilter: args.tags as any
  //       }),
  //       TaskEither.runUnsafe
  //     )
  // }
};

// const startCurrentEntry = async (
//   now: Time.Date,
//   start: Time.Date,
//   newEntry: Toggl.NewEntry
// ): Promise<Result.Result<Toggl.Entry>> =>
//   (await Toggl.getOngoingEntry()).fold(
//     Utility.throwError,
//     async ongoingEntry => {
//       // If there is an existing current entry, stop it
//       ongoingEntry.map(async ongoingEntry => {
//         (await Toggl.stopEntry(ongoingEntry)).getOrElseL(Utility.throwError);

//         /*
//           If we're starting the current time entry in the future, the old
//           entry's stop needs to be set to the new entry's start
//         */
//         if (now.valueOf() < start.valueOf()) {
//           (await Toggl.putEntry({
//             ...ongoingEntry,
//             stop: start.toISOString()
//           })).getOrElseL(Utility.throwError);
//         }
//       });

//       // Start the new entry
//       const currentEntry = await Toggl.startEntry(newEntry);

//       // If the current entry starts now, we're done, otherwise update the start
//       return start === now
//         ? currentEntry
//         : Toggl.putEntry({
//             ...currentEntry.getOrElseL(Utility.throwError),
//             start: start.toISOString()
//           });
//     }
//   );

/*
  If any of the tags or their connections has a name which matches a project,
  return that match. This is primarily used to get the nice colored timeline
  view in Toggl's web interface.
*/
// const projectFromTags = async (
//   tags: Tag.Tag[]
// ): Promise<Either.Either<Error, Toggl.Project | undefined>> =>
//   (await Toggl.getProjects()).map(projects =>
//     projects.find(({ name }) => tags.map(({ name }) => name).includes(name))
//   );
