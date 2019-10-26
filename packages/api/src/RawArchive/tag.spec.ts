import { makeTagLoader } from ".";
import * as Tag from "./tag";

const someTag = {
  id: "123",
  name: "lol",
  aliases: ["test"],
  connections: [],
  meta: {
    created: 123,
    updated: 123
  }
};

describe("tag", () => {
  test.each`
    filter                              | description     | tags         | result
    ${{}}                               | ${"a sentence"} | ${[someTag]} | ${[]}
    ${{ include: { names: ["test"] } }} | ${"a sentence"} | ${[]}        | ${[]}
    ${{ include: { names: ["test"] } }} | ${"a sentence"} | ${[someTag]} | ${[someTag]}
    ${{}}                               | ${"what lol"}   | ${[someTag]} | ${[someTag]}
    ${{ include: { ids: ["123"] } }}    | ${""}           | ${[someTag]} | ${[someTag]}
    ${{ include: { names: ["lol"] } }}  | ${""}           | ${[someTag]} | ${[someTag]}
    ${{ exclude: { ids: ["123"] } }}    | ${""}           | ${[someTag]} | ${[]}
    ${{ exclude: { ids: ["123"] } }}    | ${"lol"}        | ${[someTag]} | ${[]}
    ${{ exclude: { names: ["lol"] } }}  | ${""}           | ${[someTag]} | ${[]}
    ${{ exclude: { names: ["lol"] } }}  | ${"lol"}        | ${[someTag]} | ${[]}
    ${{ include: { names: ["lol"] } }}  | ${"lol"}        | ${[someTag]} | ${[someTag]}
  `(
    "with filter $filter and description $description and tags $tags should produce $result",
    ({ filter, description, tags, result }) => {
      expect(
        Tag.getMatchingTags(filter, description, makeTagLoader(tags))
      ).toEqual(result);
    }
  );
});
