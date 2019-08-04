import * as Tag from "./tag";

describe("tag", () => {
  test("that it should return no tags when there were none", () => {
    expect(Tag.getMatchingTags({}, "a sentence", [])).toEqual([]);
  });

  test("that it should not find matching tags even if included", () => {
    expect(
      Tag.getMatchingTags({ include: { names: ["test"] } }, "a sentence", [])
    ).toEqual([]);
  });

  test("that it should have included tag if even if not in description", () => {
    const targetTag = {
      id: "123",
      name: "lol",
      aliases: ["test"],
      connections: []
    };
    expect(
      Tag.getMatchingTags({ include: { names: ["test"] } }, "a sentence", [
        targetTag
      ])
    ).toEqual([targetTag]);
  });

  test("that it should have included tag when only in description", () => {
    const targetTag = {
      id: "123",
      name: "lol",
      aliases: ["test"],
      connections: []
    };
    expect(Tag.getMatchingTags({}, "a sentence lol", [targetTag])).toEqual([
      targetTag
    ]);
  });

  // TODO: fix this test by adding back in exclude
  // test("that it should exclude tag even when in description if exclude provided", () => {
  //   const targetTag = {
  //     id: "123",
  //     name: "lol",
  //     aliases: ["test"],
  //     connections: []
  //   };
  //   expect(
  //     Tag.getMatchingTags({ exclude: { names: ["lol"] } }, "a sentence lol", [
  //       targetTag
  //     ])
  //   ).toEqual([]);
  // });
});
