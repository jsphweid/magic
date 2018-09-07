import * as Data from "./Data";

const trim = (indent: string, text: string): string =>
  text.replace(new RegExp(indent, "g"), "").trim();

describe("transforming JSON into an SMS-friendly format", () => {
  const STRING = "string";
  const INT = 123;
  const FLOAT = 1.23;

  const primitives = [STRING, INT, FLOAT, true, false, null];

  describe("non-objects", () => {
    test("primitive values are stringified", () => {
      expect(primitives.map(value => Data.toString(value))).toEqual([
        STRING,
        `${INT}`,
        `${FLOAT}`,
        "true",
        "false",
        "null"
      ]);
    });

    test("short arrays are one-liners", () => {
      expect(Data.toString([STRING, INT, true, null])).toBe(
        `${STRING} ${INT} true null`
      );
    });

    test("long arrays are on multiple lines", () => {
      expect(Data.toString(primitives)).toBe(
        trim(
          "            ",
          `
            ${STRING}
            ${INT}
            ${FLOAT}
            true
            false
            null
          `
        )
      );
    });
  });

  describe("objects", () => {
    const object = primitives
      .filter(value => value !== null)
      .reduce((acc, value, index) => ({ ...acc, [`key${index}`]: value }), {});

    const objectAsString = trim(
      "        ",
      `
        key0 ${STRING}
        key1 ${INT}
        key2 ${FLOAT}
        key3 true
        key4 false
      `
    );

    test("small objects are one-liners", () => {
      expect(Data.toString({ a: "a", b: 1 })).toBe(`a a b 1`);
    });

    test("large objects are on multiple lines", () => {
      expect(Data.toString(object)).toBe(objectAsString);
    });

    test("null and empty fields are discarded", () => {
      expect(
        Data.toString({
          ...object,
          empty: {
            object: {},
            array: [],
            null: null
          }
        })
      ).toBe(objectAsString);
    });

    test("nested objects are indented", () => {
      expect(
        Data.toString({
          parent1: { child1: object, child2: object },
          parent2: { child3: object, child4: object }
        })
      ).toBe(
        trim(
          "            ",
          `
            parent1
             child1
              ${objectAsString.replace(/\n/g, "\n              ")}
             child2
              ${objectAsString.replace(/\n/g, "\n              ")}
            parent2
             child3
              ${objectAsString.replace(/\n/g, "\n              ")}
             child4
              ${objectAsString.replace(/\n/g, "\n              ")}
          `
        )
      );
    });

    test("objects with single fields are collapsed upward", () => {
      console.log(
        Data.toString({
          a: 1,
          isTrue: {
            and: {
              collapse: true
            }
          }
        })
      );
    });
  });
});
