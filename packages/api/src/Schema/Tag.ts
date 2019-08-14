import { Array, Either, Error, Fn, pipe } from "@grapheng/prelude";
import gql from "graphql-tag";

// import { RawTag } from "~/raw-archive";

import { Resolvers } from "../../GeneratedTypes";
// import * as Utility from "../Utility";

export const typeDefs = gql`
  type Tag__Tag implements Node__Identifiable & Node__Persisted {
    ID: ID!
    meta: Node__Meta!
    name: String!
    aliases: [String!]!
    connections: [Tag__Tag!]!
  }

  interface Tag__Tagged {
    tags: [Tag__Tag!]!
  }

  type Tag__Query {
    tags(include: Tag__Selection, exclude: Tag__Selection): [Tag__Tag!]!
  }

  type Tag__Mutation {
    create(
      name: String!
      aliases: [String!] = []
      connections: [String!] = []
    ): Tag__Tag

    update(
      ID: ID!
      name: String
      aliases: [String!]
      connections: [String!]
    ): Tag__Tag!

    delete(ID: ID!): Boolean!
  }

  input Tag__Filter {
    include: Tag__Selection
    exclude: Tag__Selection
  }

  input Tag__Selection {
    ids: [ID!]
    names: [String!]
  }
`;

// const getOrElseBlowUp = <T>(op: Option.Option<T>): T =>

// pipe(
//   context.archive.getRawTagsByIDs(source.connections),
//   possibleTags => possibleTags.map(Option.(() => null))
// )

export const resolvers: Resolvers = {
  Tag__Tag: {
    ID: source => source.id,

    connections: (source, _args, context) =>
      pipe(
        context.archiveModel.getRawTagsByIDs(source.connections),
        Array.filterMap(Fn.identity)
      )
  },

  Tag__Query: {
    // TODO: add back in filter
    tags: async (_, __, context) => context.archiveModel.getAllRawTags()
  },

  Tag__Mutation: {
    create: (_, args, context) =>
      pipe(
        context.archiveModel.writeNewTag(args),
        Either.fold(Error.throw, Fn.identity)
      ),
    update: (_, args, context) =>
      pipe(
        context.archiveModel.updateTag(args.ID, {
          ...args,
          name: args.name || undefined,
          aliases: args.aliases || undefined,
          connections: args.connections || undefined
        }),
        Either.fold(Error.throw, Fn.identity)
      ),
    delete: (_, args, context) =>
      pipe(
        context.archiveModel.deleteTag(args.ID),
        Either.fold(Error.throw, Fn.identity)
      )
  }
};
