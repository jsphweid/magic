import { Either, Option, pipe } from "@grapheng/prelude";

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
      pipe(
        makeArchive(emptyArchive).writeNewTag({}),
        Either.fold(fail, archive => {
          expect(archive.raw.tags.length).toBe(1);
          expect(archive.raw.tags[0]).toEqual(
            expect.objectContaining({
              aliases: [],
              connections: [],
              name: ""
            })
          );
          checkIdIsValid(archive.raw.tags[0].id);
        })
      );
    });

    test("that writeNewTag fails if name already exists", () => {
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [{ id: "123", aliases: [], connections: [], name: "one" }]
        }),
        archive => archive.writeNewTag({ name: "one" }),
        newArchive => {
          expect(Either.isLeft(newArchive)).toBe(true);
        }
      );
    });

    test("that writeNewTag fails if name already exists in an alias with different casing", () => {
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [{ id: "123", aliases: ["onE"], connections: [], name: "" }]
        }),
        archive => archive.writeNewTag({ name: "One" }),
        newArchive => {
          expect(Either.isLeft(newArchive)).toBe(true);
        }
      );
    });

    test("that writeNewTag fails if an alias already exists in an alias with different casing", () => {
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [
            { id: "123", aliases: ["One"], connections: [], name: "something" }
          ]
        }),
        archive => archive.writeNewTag({ name: "different", aliases: ["oNe"] }),
        result => {
          expect(Either.isLeft(result)).toBe(true);
        }
      );
    });

    test("that writeNewTag fails if it cannot result a connection", () => {
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [
            { id: "123", aliases: ["One"], connections: [], name: "something" }
          ]
        }),
        archive =>
          archive.writeNewTag({
            name: "different",
            aliases: ["another"],
            connections: ["does not exist"]
          }),
        result => {
          expect(Either.isLeft(result)).toBe(true);
        }
      );
    });
  });

  describe("getRawTagByID", () => {
    test("that it does not get a raw tag if it doesn't exist", () => {
      pipe(
        makeArchive(emptyArchive).getRawTagByID("123"),
        Option.isNone,
        isNone => {
          expect(isNone).toBe(true);
        }
      );
    });

    test("that it gets a raw tag if it exists", () => {
      const rawTag = { id: "123", aliases: ["one"], connections: [], name: "" };
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [rawTag]
        }).getRawTagByID("123"),
        result => {
          expect(Option.isSome(result)).toBe(true);
          Option.fold(fail, tag => {
            expect(tag).toEqual(rawTag);
          });
        }
      );
    });
  });

  describe("getRawTagsByIDs", () => {
    test("that everything should be a nulled option when given an empty archive", () => {
      pipe(
        makeArchive(emptyArchive).getRawTagsByIDs(["123", "234"]),
        results => {
          expect(Option.isNone(results[0])).toBe(true);
          expect(Option.isNone(results[1])).toBe(true);
          expect(results[2]).toEqual(undefined);
        }
      );
    });

    test("that it gets some rawTags if they exist", () => {
      const rawTag = { id: "123", aliases: ["one"], connections: [], name: "" };
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [rawTag]
        }).getRawTagsByIDs(["234", "123"]),
        result => {
          expect(Option.isNone(result[0])).toBe(true);
          expect(Option.isSome(result[1])).toBe(true);
          pipe(
            result[1],
            Option.fold(fail, tag => {
              expect(tag).toEqual(rawTag);
            })
          );
        }
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
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [rawTag]
        }),
        archive => archive.getRawTagByName("thing"),
        result => {
          expect(Option.isNone(result)).toBe(true);
        }
      );
    });

    test("should find the tag if it exists in aliases", () => {
      const rawTag = { id: "123", aliases: ["one"], connections: [], name: "" };
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [rawTag]
        }).getRawTagByName("oNe"),
        Option.fold(fail, tag => {
          expect(tag).toEqual(rawTag);
        })
      );
    });

    test("should find the tag if it exists in name", () => {
      const rawTag = {
        id: "123",
        aliases: ["one"],
        connections: [],
        name: "lol"
      };
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [rawTag]
        }).getRawTagByName("lOl"),
        Option.fold(fail, tag => {
          expect(tag).toEqual(rawTag);
        })
      );
    });
  });

  describe("mutateTag", () => {
    test("that a basic update should work", () => {
      const rawTag = { id: "123", aliases: ["one"], connections: [], name: "" };
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [rawTag]
        }).mutateTag("123", {
          aliases: ["two"],
          name: "other"
        }),
        Either.fold(fail, archive => {
          expect(archive.raw.tags[0]).toEqual({
            id: "123",
            aliases: ["two"],
            name: "other",
            connections: []
          });
        })
      );
    });

    test("should fail if tag does not exist", () => {
      pipe(
        makeArchive(emptyArchive).mutateTag("123", {
          aliases: ["two"],
          name: "other"
        }),
        result => {
          expect(Either.isLeft(result)).toBe(true);
        }
      );
    });

    test("that modifying a connection that exists works successfully", () => {
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [
            { id: "123", aliases: ["one"], connections: [], name: "one name" },
            {
              id: "234",
              aliases: ["two"],
              connections: [],
              name: "two name"
            }
          ]
        }).mutateTag("234", {
          connections: ["123"]
        }),
        Either.fold(fail, archive => {
          expect(archive.raw.tags[1]).toEqual({
            id: "234",
            aliases: ["two"],
            connections: ["123"],
            name: "two name"
          });
        })
      );
    });

    test("that modifying a connection that does not exist fails", () => {
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [
            { id: "123", aliases: ["one"], connections: [], name: "one name" },
            {
              id: "234",
              aliases: ["other"],
              connections: [],
              name: "other name"
            }
          ]
        }).mutateTag("234", {
          connections: ["nop"]
        }),
        result => {
          expect(Either.isLeft(result)).toBe(true);
        }
      );
    });
  });
});