import * as Utility from "../Utility";
import * as Reply from "./Reply";

describe("transforming JSON into an SMS-friendly format", () => {
  const STRING = "string";
  const INT = 123;
  const FLOAT = 1.23;

  const primitives = [STRING, INT, FLOAT, true, false, null];

  describe("non-objects", () => {
    test("primitive values are stringified", () => {
      expect(primitives.map(value => Reply.fromJSONValue(value))).toEqual([
        STRING,
        `${INT}`,
        `${FLOAT}`,
        "true",
        "false",
        "null"
      ]);
    });

    test("short arrays are one-liners", () => {
      expect(Reply.fromJSONValue([STRING, INT, true, null])).toBe(
        `${STRING} ${INT} true null`
      );
    });

    test("long arrays are on multiple lines", () => {
      expect(Reply.fromJSONValue(primitives)).toBe(
        Utility.trim`
          ${STRING}
          ${INT}
          ${FLOAT}
          true
          false
          null
        `
      );
    });
  });

  describe("objects", () => {
    const object = primitives
      .filter(value => value !== null)
      .reduce((acc, value, index) => ({ ...acc, [`key${index}`]: value }), {});

    const objectAsString = Utility.trim`
      key0: ${STRING}
      key1: ${INT}
      key2: ${FLOAT}
      key3: true
      key4: false
    `;

    test("small objects are one-liners", () => {
      expect(Reply.fromJSONValue({ a: "a", b: 1 })).toBe(`a: a b: 1`);
    });

    test("large objects are on multiple lines", () => {
      expect(Reply.fromJSONValue(object)).toBe(objectAsString);
    });

    test("null and empty fields are discarded", () => {
      expect(
        Reply.fromJSONValue({
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
        Reply.fromJSONValue({
          parent1: { child1: object, child2: object },
          parent2: { child3: object, child4: object }
        })
      ).toBe(
        Utility.trim`
          parent1:
           child1:
            ${objectAsString.replace(/\n/g, "\n            ")}
           child2:
            ${objectAsString.replace(/\n/g, "\n            ")}
          parent2:
           child3:
            ${objectAsString.replace(/\n/g, "\n            ")}
           child4:
            ${objectAsString.replace(/\n/g, "\n            ")}
        `
      );
    });

    test("objects with single fields are collapsed upward", () => {
      expect(
        Reply.fromJSONValue({
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
      expect(Reply.fromJSONValue(["a", { b: true, c: true }, "d"])).toBe(
        "a b: true c: true d"
      );
    });

    test("arrays with large objects", () => {
      expect(
        Reply.fromJSONValue([
          "item",
          { x: true, y: false, z: false, a: false },
          "item"
        ])
      ).toBe(
        Utility.trim`
          item
          x: true
          y: false
          z: false
          a: false
          item
        `
      );
    });
  });
});
