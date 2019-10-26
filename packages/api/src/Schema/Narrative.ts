import { Fn, Option, pipe, TaskEither } from "@grapheng/prelude";
import gql from "graphql-tag";
import Moment from "moment-timezone";

import {
  Narrative__QueryNarrativesArgs,
  Resolvers,
  Time__Selection
} from "../../GeneratedCode";
import { RawNarrative } from "../RawArchive";
import { removeNullsAndUndefineds } from "../Utility";
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
    update(
      id: ID!
      description: String
      # time: Time__Selection
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

export const timeBasedFilter = (selection?: Time__Selection | null) => (
  narrative: RawNarrative
) =>
  selection
    ? pipe(
        Time.fromInputArgs(selection),
        timeSelection =>
          Time.isInterval(timeSelection)
            ? Time.instantIsInInterval(
                Time.instant(Moment(narrative.start)),
                timeSelection
              )
            : true
      )
    : true;

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
        .filter(filterNarratives(args))
  },
  Narrative__Mutation: {
    new: (_, args, context) =>
      TaskEither.runUnsafe(
        context.archiveModel.createNewNarrative({
          description: args.description,
          tagsFilter: args.tags,
          timeSelection: args.time ? Time.fromInputArgs(args.time) : null
        })
      ),
    update: (_, args, context) =>
      TaskEither.runUnsafe(
        context.archiveModel.updateNarrative({
          id: args.id,
          description: args.description,
          tagsFilter: args.tags
        })
      )
  },

  Narrative__Narrative: {
    ID: source => source.id,
    tags: (source, _, context) =>
      pipe(
        context.archiveModel.getRawTagsByIDs(source.tags),
        results => results.map(Option.fold(Fn.constNull, Fn.identity)),
        removeNullsAndUndefineds
      ),
    time: source =>
      pipe(
        Time.fromSelection({
          start: Moment(source.start),
          stop: source.stop ? Moment(source.stop) : undefined
        })
      )
  }
};
