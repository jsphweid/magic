import gql from "graphql-tag";
import { intersection } from "lodash/fp";
import Moment from "moment";

import { Resolvers } from "../../GeneratedTypes";
import * as Result from "../Result";
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

export interface Tag {
  ID: string;
  name: string;
  aliases: string[];
  connections: string[];
}

export interface Tagged {
  tags: Tag[];
}

export interface Filter {
  include: Selection;
  exclude: Selection;
}

export interface Selection {
  names: string[];
  ids: string[];
}

export const defaultSelection = (
  overrides?: DeepPartial<Selection>
): Selection =>
  !overrides
    ? { names: [], ids: [] }
    : {
        names: (overrides.names as string[]) || [],
        ids: (overrides.ids as string[]) || []
      };

export const defaultFilter = (
  overrides?: DeepPartial<Filter>
): Result.Result<Filter> => {
  const filter: Filter = !overrides
    ? { include: defaultSelection(), exclude: defaultSelection() }
    : {
        include: defaultSelection(overrides.include),
        exclude: defaultSelection(overrides.exclude)
      };

  // Tags can't be both included and excluded
  const conflicts = [
    ...intersection(filter.include.names, filter.exclude.names),
    ...intersection(filter.include.ids, filter.exclude.ids)
  ];

  return conflicts.length === 0
    ? Result.success(filter)
    : Result.error(
        conflicts
          .map(
            conflict =>
              `"${conflict}" was included and excluded in the same selection`
          )
          .join("\n")
      );
};

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

    // (
    //   await context.tagLoader.loadMany(tag.connections)
    // )
    // .map(tag => tag.getOrElseL(Utility.throwError))
  },

  // Tag__Tagged: {
  //   __resolveType: () => "Tag__Tagged"
  // },

  Tag__Query: {
    tags: async (_, _args, context) =>
      void console.log("-------", context.archive.getAllTags()) ||
      context.archive.getAllTags()
  },

  Tag__Mutation: {
    create: async (_, _args, context) => {
      // await validateTag(context, _args);

      // create new raw tag
      // context.archive.writeNewTag(_args);

      // double check a similar one doesn't exist
      // get back from db

      // actually create a new ID
      return context.archive.writeNewTag(_args);
    }
    // update: async (_, _args, context) => {
    //   await validateTag(context, _args);

    //   // if (_args.connections) {
    //   //   updateObj.connections = transformConnectionsToReferences(
    //   //     context,
    //   //     _args.connections
    //   //   );
    //   // }

    //   // await context.DB.collection("tags")
    //   //   .doc(_args.ID)
    //   //   .set(updateObj, { merge: true });

    //   return context.archive
    //     .getRawTagByID(_args.ID)
    //     .fold(Utility.throwError, rawTag =>
    //       context.archive.writeNew({
    //         ...context.archive.raw,
    //         tags: [
    //           ...context.archive.raw.tags.filter(t => t.id !== _args.ID),
    //           {
    //             id: _args.ID,
    //             aliases: _args.aliases || rawTag.aliases,
    //             name: _args.name || rawTag.name,
    //             connections: _args.connections || rawTag.connections
    //           }
    //         ]
    //       })
    //     );

    //   context.archive.getRawTagByID(_args.ID);

    //   return (await Loader.getByID(context.DB, _args.ID)).getOrElseL(
    //     Utility.throwError
    //   );
    // },
    // delete: async (_, _args, context) => {
    //   await context.DB.collection("tags")
    //     .doc(_args.ID)
    //     .delete();
    //   return true;
    // }
  }
};

// const transformConnectionsToReferences = (
//   context: Context.Context,
//   connections: string[]
// ): firebase.firestore.DocumentReference[] => {
//   return connections.map(id => context.DB.collection("tags").doc(id));
// };

// const validateTag = async (
//   context: Context.Context,
//   tag: { aliases?: string[]; name: string; connections?: string[] }
// ): Promise<void> => {
//   // TODO: Don't create if it already exists? Also consider checking aliases...
//   // const tagWithSameName = allTags.find(tag => tag.name === _args.name);

//   // TODO: Prevent tag from connecting to itself

//   if (tag.connections) {
//     const allTags = (await Loader.getAll(context)).getOrElseL(
//       Utility.throwError
//     );

//     // double check that any alleged connections exist...
//     const existingTagIds = allTags.map(t => t.ID);
//     const allConnectionsValid = tag.connections.every(c =>
//       existingTagIds.includes(c)
//     );
//     if (!allConnectionsValid) {
//       Utility.throwError(
//         new GraphQL.GraphQLError(
//           "At least one of the connections you entered is not a real Tag."
//         )
//       );
//     }
//   }
// };

// export const getAllFromNames = async (
//   context: Context.Context,
//   names: string[]
// ): Promise<Result.Result<Tag[]>> => {
//   const tags: Tag[] = [];
//   for (const result of await context.tagLoader.loadMany(names)) {
//     if (result.isLeft()) return Result.error(result.value.message) as any;
//     tags.push(result.value);
//   }

//   return Result.success(tags) as any;
// };

// export const findMatches = async (
//   context: Context.Context,
//   search: string
// ): Promise<Either.Either<Error, Tag[]>> =>
//   (await Loader.getAll(context)).map(tags => {
//     const matches = new Map<string, Tag>();

//     for (const tag of tags) {
//       isMatch(search, tag).map(matchingWord =>
//         matches.set(
//           matchingWord,

//           // Use the most recent tag if a word matches more than once
//           tag
//         )
//       );
//     }

//     return Array.from(matches.values());
//   });

// export const isMatch = (search: string, tag: Tag): Option.Option<string> => {
//   const namesToMatch = [
//     tag.name,

//     // Match any aliases
//     ...Option.fromNullable(tag.aliases).getOrElse([])
//   ];

//   return Option.fromNullable(
//     /*
//       Surround the string with hypens so we can match based on whole words, not words within a word
//     */
//     `-${nameFromString(search)}-`.match(
//       new RegExp(`-${namesToMatch.join("-|-")}-`, "g")
//     )
//   ).map(matches => matches[0].slice(1, -1)); // Remove the hyphens
// };

// export const isMatchForNames = async (
//   context: Context.Context,
//   names: string[]
// ): Promise<Result.Result<boolean>> =>
//   (await Loader.getAll(context)).map(
//     tags =>
//       names.filter(name => tags.find(tag => isMatch(name, tag).isSome()))
//         .length === names.length
//   );

// // names.filter(name => tags.find(tag => isMatch(name, tag).isSome())).length ===
// // names.length;

// // Converts human names to tag names e.g. "Getting ready" -> "getting-ready"
// const nameFromString = (string: string): string =>
//   string
//     .trim()
//     .toLowerCase()
//     .replace(/ /g, "-");
