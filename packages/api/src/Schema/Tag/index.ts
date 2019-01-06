import { either as Either, option as Option } from "fp-ts";
import gql from "graphql-tag";
import { cloneDeep, intersection } from "lodash/fp";
import Moment from "moment";

import * as GraphQL from "graphql";
import * as Result from "../../Result";
import * as Utility from "../../Utility";
import * as Context from "../Context";
import * as Time from "../Time";
import * as Loader from "./Loader";

export * from "./Loader";

export const schema = gql`
  type Tag__Tag implements Node__Identifiable & Node__Persisted {
    ID: ID!
    metadata: Node__Metadata!
    name: String!
    aliases: [String!]!
    score: Int!
    lastOccurrence: Time__FormattedDate
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
      score: Int = 0
      connections: [String!] = []
    ): Tag__Tag!

    update(
      ID: ID!
      name: String!
      aliases: [String!]
      score: Int
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
  score: number;
  lastOccurrence: Option.Option<Time.Date>;
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

export const resolvers = {
  Tag__Tag: {
    metadata: () => ({
      created: Moment(),
      updated: Moment()
    }),

    connections: async (
      tag: Tag,
      _args: undefined,
      context: Context.Context
    ): Promise<Tag[]> =>
      (await context.tagLoader.loadMany(tag.connections)).map(tag =>
        tag.getOrElseL(Utility.throwError)
      )
  },

  Tag__Tagged: {
    __resolveType: () => "Tag__Tagged"
  },

  Tag__Query: {
    tags: async (
      _: undefined,
      _args: DeepPartial<Selection>,
      context: Context.Context
    ): Promise<Tag[]> => {
      return (await Loader.getAll(context)).getOrElseL(Utility.throwError);
    }
  },

  Tag__Mutation: {
    create: async (
      _: undefined,
      _args: {
        name: string;
        aliases: string[];
        score: number;
        connections: any[];
      },
      context: Context.Context
    ): Promise<Tag> => {
      await validateTag(context, _args);

      const connections = transformConnectionsToReferences(
        context,
        _args.connections
      );
      const newTagRef = await context.DB.collection("tags").doc();
      newTagRef.set({ ..._args, connections });

      return (await Loader.getByID(context.DB, newTagRef.id)).getOrElseL(
        Utility.throwError
      );
    },
    update: async (
      _: undefined,
      _args: {
        ID: string;
        name?: string;
        aliases?: string[];
        score?: number;
        connections?: any[];
      },
      context: Context.Context
    ): Promise<Tag> => {
      await validateTag(context, _args);

      const updateObj = cloneDeep(_args);
      delete updateObj.ID;

      if (_args.connections) {
        updateObj.connections = transformConnectionsToReferences(
          context,
          _args.connections
        );
      }

      await context.DB.collection("tags")
        .doc(_args.ID)
        .set(updateObj, { merge: true });

      return (await Loader.getByID(context.DB, _args.ID)).getOrElseL(
        Utility.throwError
      );
    },
    delete: async (
      _: undefined,
      _args: {
        ID: string;
      },
      context: Context.Context
    ): Promise<boolean> => {
      await context.DB.collection("tags")
        .doc(_args.ID)
        .delete();
      return true;
    }
  }
};

const transformConnectionsToReferences = (
  context: Context.Context,
  connections: string[]
): firebase.firestore.DocumentReference[] => {
  return connections.map(id => context.DB.collection("tags").doc(id));
};

const validateTag = async (
  context: Context.Context,
  tag: Partial<Tag>
): Promise<void> => {
  // TODO: Don't create if it already exists? Also consider checking aliases...
  // const tagWithSameName = allTags.find(tag => tag.name === _args.name);

  // TODO: Prevent tag from connecting to itself

  if (tag.connections) {
    const allTags = (await Loader.getAll(context)).getOrElseL(
      Utility.throwError
    );

    // double check that any alleged connections exist...
    const existingTagIds = allTags.map(t => t.ID);
    const allConnectionsValid = tag.connections.every(c =>
      existingTagIds.includes(c)
    );
    if (!allConnectionsValid) {
      Utility.throwError(
        new GraphQL.GraphQLError(
          "At least one of the connections you entered is not a real Tag."
        )
      );
    }
  }
};

export const getAllFromNames = async (
  context: Context.Context,
  names: string[]
): Promise<Result.Result<Tag[]>> => {
  const tags: Tag[] = [];
  for (const result of await context.tagLoader.loadMany(names)) {
    if (result.isLeft()) return Result.error(result.value.message) as any;
    tags.push(result.value);
  }

  return Result.success(tags) as any;
};

export const findMatches = async (
  context: Context.Context,
  search: string
): Promise<Either.Either<Error, Tag[]>> =>
  (await Loader.getAll(context)).map(tags => {
    const matches = new Map<string, Tag>();

    for (const tag of tags) {
      isMatch(search, tag).map(matchingWord =>
        matches.set(
          matchingWord,

          // Use the most recent tag if a word matches more than once
          Option.fromNullable(matches.get(matchingWord))
            .map(previousMatch => mostRecentlyUsed(tag, previousMatch))
            .getOrElse(tag)
        )
      );
    }

    return Array.from(matches.values());
  });

export const isMatch = (search: string, tag: Tag): Option.Option<string> => {
  const isTagPerson = Option.fromNullable(tag.connections)
    .getOrElse([])
    .reduce(
      (previous, connection) =>
        previous ||
        [
          "YdmZlyto8zURRI2Ulk1i", // "family"
          "hP1VWOGAAj3OdUBpLmWk", // "friend"
          "J0eE07g102VFA1w19LJT" // "coworker"
        ].includes(connection),
      false
    );

  const namesToMatch = [
    tag.name,

    // If the tag is a person, also match by first name
    ...(isTagPerson ? [tag.name.split("-")[0]] : []),

    // Match any aliases
    ...Option.fromNullable(tag.aliases).getOrElse([])
  ];

  return Option.fromNullable(
    /*
      Surround the string with hypens so we can match based on whole words, not
      words within a word
    */
    `-${nameFromString(search)}-`.match(
      new RegExp(`-${namesToMatch.join("-|-")}-`, "g")
    )
  ).map(matches => matches[0].slice(1, -1)); // Remove the hyphens
};

export const isMatchForNames = async (
  context: Context.Context,
  names: string[]
): Promise<Result.Result<boolean>> =>
  (await Loader.getAll(context)).map(
    tags =>
      names.filter(name => tags.find(tag => isMatch(name, tag).isSome()))
        .length === names.length
  );

// names.filter(name => tags.find(tag => isMatch(name, tag).isSome())).length ===
// names.length;

const mostRecentlyUsed = (a: Tag, b: Tag): Tag =>
  a.lastOccurrence.getOrElseL(() => Moment(0)).valueOf() >
  b.lastOccurrence.getOrElseL(() => Moment(0)).valueOf()
    ? a
    : b;

// Converts human names to tag names e.g. "Getting ready" -> "getting-ready"
const nameFromString = (string: string): string =>
  string
    .trim()
    .toLowerCase()
    .replace(/ /g, "-");
