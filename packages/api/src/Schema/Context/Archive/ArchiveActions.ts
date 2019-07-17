import * as Result from "../../../Result";
import { RawArchive, RawTag } from "./Archive";

interface NameMembershipMap {
  [key: string]: boolean;
}

const arrToMap = (arr: string[]): NameMembershipMap =>
  arr.reduce((previous, current) => ({ ...previous, [current]: true }), {});

const existingTagNamesMap = (tags: RawTag[]): NameMembershipMap =>
  tags.reduce(
    (previous, current) => ({
      ...previous,
      ...arrToMap(getAllNamesInTag(current))
    }),
    {}
  );

const getAllNamesInTag = (rawTag: Partial<RawTag>): string[] => [
  ...(rawTag.aliases || []),
  ...(rawTag.name ? [rawTag.name] : [])
];

const getClonedArchive = (rawArchive: RawArchive): RawArchive =>
  JSON.parse(JSON.stringify(rawArchive));

export const createNewTag = (
  rawArchive: RawArchive,
  rawTagToAdd: RawTag
): Result.Result<RawArchive> => {
  const clonedArchive = getClonedArchive(rawArchive);
  const existingTagNames = existingTagNamesMap(rawArchive.tags);
  const tagIsUnique = getAllNamesInTag(rawTagToAdd).every(
    name => !existingTagNames[name]
  );
  const newTag = {
    id: makeRandomUniqueID(),
    name: "", // it will get overridden since name is ultimately required
    aliases: [],
    ...tag,
    connections: [] // a new tag cannot have connections already for now
  };
  return tagIsUnique
    ? Local.saveNewArchive({
        ...clonedArchive,
        tags: [...clonedArchive.tags, newTag]
      }).then(() => newTag)
    : Promise.resolve(null);
};
