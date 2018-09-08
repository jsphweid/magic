import _ from "lodash";
// import wrap from "word-wrap";

const MAX_WIDTH = 23;

export type JSONValue = JSONObject | JSONArray | JSONPrimitive;

export interface JSONObject {
  [key: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}
export type JSONPrimitive = string | number | boolean | null;

export const toString = (data: JSONValue): string => withIndent("", data);

export const withIndent = (
  indent: string,
  value: JSONValue,
  addIndent: boolean = false
): string => {
  const updatedIndent = `${indent}${addIndent ? " " : ""}`;
  return isObject(value)
    ? objectToString(updatedIndent, value)
    : Array.isArray(value)
      ? arrayToString(updatedIndent, value)
      : primitiveToString(updatedIndent, value);
};

const isObject = (value: JSONValue): value is JSONObject =>
  value !== null && typeof value === "object";

const objectToString = (
  indent: string,
  object: { [key: string]: any }
): string =>
  arrayToString(
    indent,
    Object.entries(object).map(
      ([key, value]) => `${key} ${withIndent(indent, value, true)}`
    )
  );

const arrayToString = (indent: string, array: JSONArray): string => {
  // const asOneLine = array.map(value => withIndent("", value)).join(" ");
  // if (!isTooLong(asOneLine)) {
  //   return asOneLine;
  // }

  return array.map(value => `${withIndent(indent, value)}`).join("");
};

const primitiveToString = (indent: string, primitive: JSONPrimitive): string =>
  typeof primitive === "string"
    ? `\n${indent}${primitive}`
    : // wrap(primitive, { indent, width: MAX_WIDTH })
      JSON.stringify(primitive);

const isTooLong = (string: string): boolean => string.length > MAX_WIDTH;

const x = toString({
  data: {
    time: {
      narratives: [
        {
          interval: {
            start: {
              formatted: "3:09 PM Fr Sep 7"
            },
            stop: null
          },
          description: "Working on GraphQL over SMS"
        }
      ],
      tagOccurrences: [
        {
          interval: {
            start: {
              formatted: "3:09 PM Fr Sep 7"
            },
            stop: null
          },
          tag: {
            name: "magic"
          }
        },
        {
          interval: {
            start: {
              formatted: "3:09 PM Fr Sep 7"
            },
            stop: null
          },
          tag: {
            name: "todd-elvers"
          }
        },
        {
          interval: {
            start: {
              formatted: "3:09 PM Fr Sep 7"
            },
            stop: null
          },
          tag: {
            name: "weed"
          }
        }
      ]
    }
  }
});

console.log(x);
console.log(JSON.stringify(x));
