import { either as Either, option as Option } from "fp-ts";
import gql from "graphql-tag";
import _ from "lodash/fp";
import Moment from "moment";

import * as Result from "../../Result";
import * as Utility from "../../Utility";
import * as Context from "../Context";
import * as Time from "../Time";
import * as Loader from "./Loader";

export * from "./Loader";

export const schema = gql`
  interface Tag__Tagged {
    tags: [Tag!]!
  }

  type Tag implements Node__Identifiable & Node__Persisted {
    ID: ID!
    metadata: Node__PersistenceMetadata!
    name: String!
    aliases: [String!]!
    score: Int!
    lastOccurrence: Time__FormattedDate
    connections: [Tag!]!
  }

  input Tag__Selection {
    include: Tag__Filter
    exclude: Tag__Filter
  }

  input Tag__Filter {
    ids: [ID!]
    names: [String!]
  }
`;

export interface Tagged {
  tags: Tag[];
}

export interface Tag {
  ID: string;
  name: string;
  aliases: string[];
  score: number;
  lastOccurrence: Option.Option<Time.Date>;
  connections: string[];
}

export interface Selection {
  include: Filter;
  exclude: Filter;
}

interface Filter {
  names: string[];
  ids: string[];
}

export interface SelectionGraphQLArgs {
  tags?: {
    include?: Partial<Filter> | null;
    exclude?: Partial<Filter> | null;
  };
}

export const selectionFromGraphQLArgs = (
  args?: SelectionGraphQLArgs | null
): Result.Result<Selection> => {
  const selection: Selection = _.defaultsDeep(
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
          .join(" ")
      );
};

export const resolvers = {
  Tag__Tagged: {
    __resolveType: () => "Tag__Tagged"
  },

  Tag: {
    connections: async (
      tag: Tag,
      _args: undefined,
      context: Context.Context
    ): Promise<Tag[]> =>
      (await context.tagLoader.loadMany(tag.connections)).map(tag =>
        tag.getOrElseL(Utility.throwError)
      )
  }
};

// export const updateLastOccurrence = async (loader: Loader.Loader, lastOccurrence: Moment.Moment)

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
