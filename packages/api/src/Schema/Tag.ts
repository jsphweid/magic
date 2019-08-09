import gql from "graphql-tag";
import Moment from "moment";

import { Resolvers } from "../../GeneratedTypes";
import * as Utility from "../Utility";

export const typeDefs = gql`
  type Tag__Tag implements Node__Identifiable & Node__Persisted {
    ID: ID!
    metadata: Node__Metadata!
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

export const resolvers: Resolvers = {
  Tag__Tag: {
    metadata: () => ({
      created: Moment(),
      updated: Moment()
    }),

    connections: async (tag, _args, context) =>
      context.archive
        .getRawTagsByIDs(tag.connections)
        .map(tag => tag.getOrElseL(Utility.throwError))
  },

  Tag__Query: {
    tags: async (_, _args, context) =>
      void console.log("-------", context.archive.getAllTags()) ||
      context.archive.getAllTags()
  },

  Tag__Mutation: {
    create: async (_, _args, context) => {
      return context.archive.writeNewTag(_args);
    }
  }
};
