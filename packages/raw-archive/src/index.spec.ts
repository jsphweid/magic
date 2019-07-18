import { Error } from "@grapheng/prelude";

import { makeArchive } from ".";

const emptyArchive = { tags: [], entries: [] };

// TODO: discuss casing and overall functional programming convention with conner
export const checkIdIsValid = (id: any): void => {
  expect(typeof id).toEqual("string");
  expect(id.length).toEqual(36);
};

describe("main", () => {
  describe("raw", () => {
    test("that raw archive is returned", () => {
      expect(makeArchive(emptyArchive).raw).toEqual(emptyArchive);
    });
  });

  describe("writeNewTag", () => {
    test("that writeNewTag works for an empty tag", () => {
      makeArchive(emptyArchive)
        .writeNewTag({})
        .fold(
          () => Error.throw_("Operation should not have failed..."),
          archive => {
            expect(archive.raw.tags.length).toBe(1);
            expect(archive.raw.tags[0]).toEqual(
              expect.objectContaining({
                aliases: [],
                connections: [],
                name: ""
              })
            );
            checkIdIsValid(archive.raw.tags[0].id);
          }
        );
    });

    test("that writeNewTag fails if name already exists", () => {
      expect(
        makeArchive({
          ...emptyArchive,
          tags: [{ id: "123", aliases: [], connections: [], name: "one" }]
        })
          .writeNewTag({ name: "one" })
          .isLeft()
      ).toBe(true);
    });

    test("that writeNewTag fails if name already exists in an alias with different casing", () => {
      expect(
        makeArchive({
          ...emptyArchive,
          tags: [{ id: "123", aliases: ["onE"], connections: [], name: "" }]
        })
          .writeNewTag({ name: "One" })
          .isLeft()
      ).toBe(true);
    });

    test("that writeNewTag fails if an alias already exists in an alias with different casing", () => {
      expect(
        makeArchive({
          ...emptyArchive,
          tags: [
            { id: "123", aliases: ["One"], connections: [], name: "something" }
          ]
        })
          .writeNewTag({ name: "different", aliases: ["oNe"] })
          .isLeft()
      ).toBe(true);
    });
  });

  describe("getRawTagByID", () => {
    test("that it does not get a raw tag if it doesn't exist", () => {
      expect(
        makeArchive(emptyArchive)
          .getRawTagByID("123")
          .isNone()
      ).toBe(true);
    });

    test("that it gets a raw tag if it exists", () => {
      const rawTag = { id: "123", aliases: ["one"], connections: [], name: "" };
      const archive = makeArchive({
        ...emptyArchive,
        tags: [rawTag]
      });
      expect(archive.getRawTagByID("123").isSome()).toBe(true);
      archive.getRawTagByID("123").foldL(
        () => Error.throw_("Operation should not have failed..."),
        tag => {
          expect(tag).toEqual(rawTag);
        }
      );
    });
  });

  describe("getRawTagsByIDs", () => {
    test("that everything should be a nulled option when given an empty archive", () => {
      const result = makeArchive(emptyArchive).getRawTagsByIDs(["123", "234"]);
      expect(result[0].isNone()).toBe(true);
      expect(result[1].isNone()).toBe(true);
      expect(result[2]).toEqual(undefined);
    });

    test("that it gets some rawTags if they exist", () => {
      const rawTag = { id: "123", aliases: ["one"], connections: [], name: "" };
      const archive = makeArchive({
        ...emptyArchive,
        tags: [rawTag]
      });
      const result = archive.getRawTagsByIDs(["234", "123"]);
      expect(result[0].isNone()).toBe(true);
      expect(result[1].isSome()).toBe(true);
      expect(
        result[1].foldL(
          () => Error.throw_("Operation should not have failed..."),
          tag => {
            expect(tag).toEqual(rawTag);
          }
        )
      );
    });
  });

  describe("getAllTags", () => {
    test("should get an empty array when there are no tags", () => {
      const result = makeArchive(emptyArchive).getAllTags();
      expect(result).toEqual([]);
    });

    test("should get items back when they exist", () => {
      const rawTag = { id: "123", aliases: ["one"], connections: [], name: "" };
      const archive = makeArchive({
        ...emptyArchive,
        tags: [rawTag]
      });
      expect(archive.getAllTags()).toEqual([rawTag]);
    });
  });

  describe("getRawTagByName", () => {
    test("should get a none option when rawTag does not exist", () => {
      const rawTag = { id: "123", aliases: ["one"], connections: [], name: "" };
      const archive = makeArchive({
        ...emptyArchive,
        tags: [rawTag]
      });
      expect(archive.getRawTagByName("thing").isNone()).toBe(true);
    });

    test("should find the tag if it exists in aliases", () => {
      const rawTag = { id: "123", aliases: ["one"], connections: [], name: "" };
      const archive = makeArchive({
        ...emptyArchive,
        tags: [rawTag]
      });
      const result = archive.getRawTagByName("oNe");
      expect(
        result.foldL(
          () => Error.throw_("Operation should not have failed..."),
          tag => {
            expect(tag).toEqual(rawTag);
          }
        )
      );
    });

    test("should find the tag if it exists in name", () => {
      const rawTag = {
        id: "123",
        aliases: ["one"],
        connections: [],
        name: "lol"
      };
      const archive = makeArchive({
        ...emptyArchive,
        tags: [rawTag]
      });
      const result = archive.getRawTagByName("lOl");
      expect(
        result.foldL(
          () => Error.throw_("Operation should not have failed..."),
          tag => {
            expect(tag).toEqual(rawTag);
          }
        )
      );
    });
  });
});
