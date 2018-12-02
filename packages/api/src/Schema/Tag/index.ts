import { either as Either, option as Option } from "fp-ts";
import gql from "graphql-tag";
import * as Runtime from "io-ts";
import _ from "lodash/fp";
import Moment from "moment";

import * as Result from "../../Result";
import * as Utility from "../../Utility";
import * as Context from "../Context";
import * as Time from "../Time";
import * as Loader from "./Loader";

export * from "./Loader";

export const schema = gql`
  type Tag implements Node {
    ID: ID!
    metadata: Node__Metadata!
    name: String!
    aliases: [String!]!
    score: Int!
    lastOccurrence: Time__FormattedDate
    connections: [Tag!]!
  }

  type Tag__Query {
    tags(include: Tag__Selection, exclude: Tag__Selection): [Tag!]!
  }

  type Tag__Mutation {
    new(
      name: String!
      aliases: [String!]
      score: Int
      connections: Tag__Selection
    ): Tag!
  }

  input Tag__Filter {
    include: Tag__Selection
    exclude: Tag__Selection
  }

  input Tag__Selection {
    ids: [ID!]
    names: [String!]
  }

  interface Tag__Tagged {
    tags: [Tag!]!
  }
`;

export type Tag = Runtime.TypeOf<typeof tag>;

const tag = Runtime.exact(
  Runtime.interface({
    name: Runtime.string,
    aliases: Runtime.array(Runtime.string),
    score: Runtime.number,
    lastOccurrence: Runtime.union([
      Time.dateTime,
      Runtime.null,
      Runtime.undefined
    ]),
    connections: Runtime.array(Runtime.string)
  })
);

export interface Filter {
  include: Selection;
  exclude: Selection;
}

export interface Selection {
  names: string[];
  ids: string[];
}

export interface Tagged {
  tags: Tag[];
}

export interface FilterArgs {
  tags?: {
    include?: Partial<Selection> | null;
    exclude?: Partial<Selection> | null;
  };
}

export const resolvers = {
  Tag__Tagged: {
    __resolveType: () => "Tag__Tagged"
  },

  Tag: {
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

  Tag__Query: {
    tags: async (
      _: undefined,
      _args: FilterArgs,
      context: Context.Context
    ): Promise<Tag[]> => {
      // const selection = selectionFromGraphQLArgs(args).getOrElseL(
      //   Utility.throwError
      // );

      return (await Loader.getAll(context)).getOrElseL(Utility.throwError);
    }
  },

  // name: String!
  // aliases: [String!]
  // score: Int
  // connections: Tag__Selection

  Tag__Mutation: {
    new: async (
      _: undefined,
      args: {
        name: string;
        aliases: string[] | null;
        score: number | null;
        connections: Selection | null;
      },
      context: Context.Context
    ): Promise<Tag> => {
      const connections = await Option.fromNullable(args.connections)
        .map(async ({ names, ids }) => {
          return (await context.tagLoader.loadMany([
            ...Option.fromNullable(names).getOrElse([]),
            ...Option.fromNullable(ids).getOrElse([])
          ])).map(result =>
            context.DB.collection("tags").doc(
              result.getOrElseL(Utility.throwError).ID
            )
          );
        })
        .getOrElse(Promise.resolve([]));

      const tag = {
        name: args.name,
        aliases: Option.fromNullable(args.aliases).getOrElse([]),
        score: Option.fromNullable(args.score).getOrElse(0),
        lastOccurrence: Option.none,
        connections: connections.map(({ id: ID }) => ID)
      };

      const document: Loader.Document = {
        name: tag.name,
        connections
      };

      Option.fromNullable(args.aliases).map(
        aliases => (document.aliases = aliases)
      );

      Option.fromNullable(args.score).map(score => (document.score = score));

      document.metadata = {};

      const { id: ID } = await context.DB.collection("tags").add(document);
      return { ID, metadata: document.metadata, ...tag };
    }
  }
};

export const filterFromArgs = (
  args?: FilterArgs | null
): Result.Result<Filter> => {
  const selection: Filter = _.defaultsDeep(
    Option.fromNullable(args).getOrElse({})
  )({
    include: { names: [], ids: [] },
    exclude: { names: [], ids: [] }
  });

  const conflicts = [
    ..._.intersection(selection.include.names, selection.exclude.names),
    ..._.intersection(selection.include.ids, selection.exclude.ids)
  ];

  return conflicts.length === 0
    ? Result.success(selection)
    : Result.error(
        conflicts
          .map(
            conflict =>
              `"${conflict}" was included and excluded in the same selection`
          )
          .join("\n")
      );
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

export const isMatchForNames = (names: string[], tags: Tag[]): boolean =>
  names.filter(name => tags.find(tag => isMatch(name, tag).isSome())).length ===
  names.length;

const mostRecentlyUsed = (a: Tag, b: Tag): Tag =>
  (a.lastOccurrence || Moment(0)).valueOf() >
  (b.lastOccurrence || Moment(0)).valueOf()
    ? a
    : b;

// Converts human names to tag names e.g. "Getting ready" -> "getting-ready"
const nameFromString = (string: string): string =>
  string
    .trim()
    .toLowerCase()
    .replace(/ /g, "-");
