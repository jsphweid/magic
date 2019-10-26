import { Either, Error, Fn, Maybe, pipe } from "@grapheng/prelude";

import { RawTag, TagLoader } from ".";
import { removeDuplicates } from "../Utility";

export type PartialOrNull<T> = { [P in keyof T]?: T[P] | null };
export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };
export type DeepPartialOrNull<T> = { [P in keyof T]?: Partial<T[P]> | null };

export interface Selection {
  names: string[];
  ids: string[];
}

export type TagFilterInput = Partial<{
  include: Maybe<PartialOrNull<Selection>>;
  exclude: Maybe<PartialOrNull<Selection>>;
}>;

export interface Filter {
  include: Selection;
  exclude: Selection;
}

const intersection = (arrays: any[]) =>
  arrays.reduce((a, b) => a.filter((c: any) => b.includes(c)));

const arrToMap = (arr: string[]): StringMembershipMap =>
  arr.reduce((previous, current) => ({ ...previous, [current]: true }), {});

interface StringMembershipMap {
  [key: string]: boolean;
}

export const existingTagNamesMap = (tags: RawTag[]): StringMembershipMap =>
  tags.reduce(
    (previous, current) => ({
      ...previous,
      ...arrToMap(getAllNamesInTagLowerCase(current))
    }),
    {}
  );

export const existingTagIDs = (tags: RawTag[]): StringMembershipMap =>
  tags.reduce((previous, current) => ({ ...previous, [current.id]: true }), {});

export const getAllNamesInTagLowerCase = (
  rawTag: Partial<RawTag>
): string[] => [
  ...(rawTag.aliases || []).map(str => str.toLowerCase()),
  ...(rawTag.name ? [rawTag.name.toLowerCase()] : [])
];

const defaultSelection = (
  overrides?: Maybe<PartialOrNull<Selection>>
): Selection =>
  overrides
    ? {
        names: overrides.names || [],
        ids: overrides.ids || []
      }
    : { names: [], ids: [] };

export const defaultFilter = (
  overrides?: TagFilterInput
): Either.ErrorOr<Filter> => {
  const filter: Filter = overrides
    ? {
        include: defaultSelection(overrides.include),
        exclude: defaultSelection(overrides.exclude)
      }
    : { include: defaultSelection(), exclude: defaultSelection() };

  // Tags can't be both included and excluded
  const conflicts = [
    ...intersection([filter.include.names, filter.exclude.names]),
    ...intersection([filter.include.names, filter.exclude.names])
  ];

  return conflicts.length === 0
    ? Either.right(filter)
    : Either.left(
        Error.detailed(
          conflicts
            .map(
              conflict =>
                `"${conflict}" was included and excluded in the same selection`
            )
            .join("\n")
        )
      );
};

const getTagNamesToMatch = (
  tagsFilter: Filter,
  description: string = ""
): string[] => [
  ...tagsFilter.include.names,
  ...(description ? [...description.split(" ")] : [])
];

export const getMatchingTags = (
  tagsFilter: TagFilterInput,
  description: string = "",
  tagLoader: TagLoader
): RawTag[] =>
  pipe(
    defaultFilter(tagsFilter),
    Either.map(filter =>
      pipe(
        tagLoader.loadManyWithoutMisses([
          ...getTagNamesToMatch(filter, description),
          ...filter.include.ids
        ]),
        includes =>
          pipe(
            tagLoader.loadManyWithoutMisses([
              ...filter.exclude.ids,
              ...filter.exclude.names
            ]),
            excludes => includes.filter(tag => !excludes.includes(tag))
          ),
        removeDuplicates,
        matchingTags =>
          matchingTags.filter(tag => !filter.exclude.ids.includes(tag.id))
      )
    ),
    Either.fold(() => [], Fn.identity)
  );
