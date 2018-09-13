import * as Reply from "./Reply";

const trim = (indent: string, text: string): string =>
  text.replace(new RegExp(indent, "g"), "").trim();

describe("transforming JSON into an SMS-friendly format", () => {
  const STRING = "string";
  const INT = 123;
  const FLOAT = 1.23;

  const primitives = [STRING, INT, FLOAT, true, false, null];

  describe("non-objects", () => {
    test("primitive values are stringified", () => {
      expect(primitives.map(value => Reply.fromResult(value))).toEqual([
        STRING,
        `${INT}`,
        `${FLOAT}`,
        "true",
        "false",
        "null"
      ]);
    });

    test("short arrays are one-liners", () => {
      expect(Reply.fromResult([STRING, INT, true, null])).toBe(
        `${STRING} ${INT} true null`
      );
    });

    test("long arrays are on multiple lines", () => {
      expect(Reply.fromResult(primitives)).toBe(
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
        key0: ${STRING}
        key1: ${INT}
        key2: ${FLOAT}
        key3: true
        key4: false
      `
    );

    test("small objects are one-liners", () => {
      expect(Reply.fromResult({ a: "a", b: 1 })).toBe(`a: a b: 1`);
    });

    test("large objects are on multiple lines", () => {
      expect(Reply.fromResult(object)).toBe(objectAsString);
    });

    test("null and empty fields are discarded", () => {
      expect(
        Reply.fromResult({
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
        Reply.fromResult({
          parent1: { child1: object, child2: object },
          parent2: { child3: object, child4: object }
        })
      ).toBe(
        trim(
          "            ",
          `
            parent1:
             child1:
              ${objectAsString.replace(/\n/g, "\n              ")}
             child2:
              ${objectAsString.replace(/\n/g, "\n              ")}
            parent2:
             child3:
              ${objectAsString.replace(/\n/g, "\n              ")}
             child4:
              ${objectAsString.replace(/\n/g, "\n              ")}
          `
        )
      );
    });

    test("objects with single fields are collapsed upward", () => {
      expect(
        Reply.fromResult({
          a: 1,
          isTrue: {
            and: {
              collapse: true
            }
          }
        })
      ).toBe("a: 1 isTrue: true");
    });

    test("arrays with small objects", () => {
      expect(Reply.fromResult(["a", { b: true, c: true }, "d"])).toBe(
        "a b: true c: true d"
      );
    });

    test("arrays with large objects", () => {
      expect(
        Reply.fromResult([
          "item",
          { x: true, y: false, z: false, a: false },
          "item"
        ])
      ).toBe(
        trim(
          "            ",
          `
            item
            x: true
            y: false
            z: false
            a: false
            item
          `
        )
      );
    });
  });
});
