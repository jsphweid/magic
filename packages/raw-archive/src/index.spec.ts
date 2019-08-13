import { Either, Error, Option, pipe } from "@grapheng/prelude";
import Moment from "moment-timezone";

import { makeArchive } from ".";

const emptyArchive = { tags: [], narratives: [] };

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

  describe("test everything", () => {
    test("that give a bunch of actions, the correct archive comes out the other side", () => {
      const oneHundredTwentyMinutesAgo = Moment().subtract(120, "minutes");
      const oneHundredTenMinutesAgo = Moment().subtract(110, "minutes");
      pipe(
        makeArchive(emptyArchive).writeNewTag({
          name: "cats",
          aliases: ["kittens"]
        }),
        Either.chain(result =>
          makeArchive(result.rawArchive).writeNewTag({
            name: "cathy",
            connections: pipe(
              makeArchive(result.rawArchive).getRawTagByName("cats"),
              Option.map(tag => [tag.id] as any),
              Option.getOrElse(() => [])
            )
          })
        ),
        Either.chain(result =>
          makeArchive(result.rawArchive).writeNewNarrative({
            description: "walking",
            timeSelection: {
              start: oneHundredTwentyMinutesAgo
            }
          })
        ),
        Either.chain(result =>
          makeArchive(result.rawArchive).writeNewNarrative({
            description: "walking with cathy",
            timeSelection: {
              start: oneHundredTenMinutesAgo
            }
          })
        ),
        Either.fold(Error.throw_, result => {
          const archive = makeArchive(result.rawArchive);
          expect(archive.raw.narratives[0]).toEqual(
            expect.objectContaining({
              description: "walking",
              start: oneHundredTwentyMinutesAgo.valueOf(),
              stop: oneHundredTenMinutesAgo.valueOf(),
              tags: []
            })
          );

          expect(archive.raw.narratives[1]).toEqual(
            expect.objectContaining({
              description: "walking with cathy",
              start: oneHundredTenMinutesAgo.valueOf()
            })
          );
          expect(archive.raw.narratives[1].tags).toEqual([
            archive.raw.tags[1].id
          ]);
          expect(archive.raw.tags[0]).toEqual(
            expect.objectContaining({
              aliases: ["kittens"],
              connections: [],
              name: "cats"
            })
          );
          expect(archive.raw.tags[1]).toEqual(
            expect.objectContaining({
              aliases: [],
              name: "cathy"
            })
          );
          expect(archive.raw.tags[1].connections).toEqual([
            archive.raw.tags[0].id
          ]);
        })
      );
    });
  });

  describe("writeNewTag", () => {
    test("that writeNewTag works for an empty tag", () => {
      pipe(
        makeArchive(emptyArchive).writeNewTag({}),
        Either.fold(fail, result => {
          const archive = makeArchive(result.rawArchive);
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

  describe("deleteTag", () => {
    test("that it deletes a tag when it exists...", () => {
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [{ id: "123", aliases: [], connections: [], name: "something" }]
        }).deleteTag("123"),
        Either.fold(fail, result => {
          const archive = makeArchive(result.rawArchive);
          expect(archive.raw.tags.filter(t => t.id === "123")).toEqual([]);
        })
      );
    });

    test("that it does not delete a tag when it does not exist", () => {
      pipe(
        makeArchive(emptyArchive).deleteTag("nope"),
        result => {
          expect(Either.isLeft(result)).toBe(true);
        }
      );
    });

    test("that it removes connections to itself from other tags...", () => {
      pipe(
        makeArchive({
          ...emptyArchive,
          tags: [
            { id: "123", aliases: [], connections: [], name: "something" },
            { id: "234", aliases: [], connections: ["123"], name: "something" },
            { id: "345", aliases: [], connections: ["123"], name: "something" },
            { id: "456", aliases: [], connections: ["234"], name: "something" }
          ]
        }).deleteTag("123"),
        Either.fold(fail, result => {
          const archive = makeArchive(result.rawArchive);
          expect(archive.raw.tags).toEqual([
            { id: "234", aliases: [], connections: [], name: "something" },
            { id: "345", aliases: [], connections: [], name: "something" },
            { id: "456", aliases: [], connections: ["234"], name: "something" }
          ]);
        })
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
        }).updateTag("123", {
          aliases: ["two"],
          name: "other"
        }),
        Either.fold(fail, result => {
          const archive = makeArchive(result.rawArchive);
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
        makeArchive(emptyArchive).updateTag("123", {
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
        }).updateTag("234", {
          connections: ["123"]
        }),
        Either.fold(fail, result => {
          const archive = makeArchive(result.rawArchive);
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
        }).updateTag("234", {
          connections: ["nop"]
        }),
        result => {
          expect(Either.isLeft(result)).toBe(true);
        }
      );
    });
  });
});
