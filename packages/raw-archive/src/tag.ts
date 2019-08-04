import { Either, Error, Fn, pipe } from "@grapheng/prelude";

import { RawTag } from ".";

export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };

export interface Selection {
  names: string[];
  ids: string[];
}

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
): Either.ErrorOr<Filter> => {
  const filter: Filter = !overrides
    ? { include: defaultSelection(), exclude: defaultSelection() }
    : {
        include: defaultSelection(overrides.include),
        exclude: defaultSelection(overrides.exclude)
      };

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

export const findMatch = (
  word: string,
  rawTags: RawTag[]
): RawTag | undefined =>
  rawTags.find(tag =>
    getAllNamesInTagLowerCase(tag).includes(word.toLowerCase())
  );

export const removeNullsAndUndefineds = <T>(
  items: Array<T | null | undefined>
) => items.filter((x): x is T => x !== null && x !== undefined);

export const findMatches = (words: string[], rawTags: RawTag[]) =>
  removeNullsAndUndefineds(words.map(word => findMatch(word, rawTags)));

export const getTagNamesToMatch = (
  tagsFilter: DeepPartial<Filter>,
  description: string = ""
): Either.ErrorOr<string[]> =>
  pipe(
    defaultFilter(tagsFilter),
    Either.map(defaultFilter => [
      ...defaultFilter.include.names,
      ...(description ? [...description.split(" ")] : [])
    ])
  );

export const getMatchingTags = (
  tagsFilter: DeepPartial<Filter>,
  description: string = "",
  rawTags: RawTag[]
): RawTag[] =>
  pipe(
    getTagNamesToMatch(tagsFilter, description),
    Either.map(tagNamesToMatch => findMatches(tagNamesToMatch, rawTags)),
    Either.fold(() => [], Fn.identity)
  );
