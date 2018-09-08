import _ from "lodash";
import wrap from "word-wrap";

const MAX_WIDTH = 30;

export type JSONValue = JSONObject | JSONArray | JSONPrimitive;

export interface JSONObject {
  [key: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}
export type JSONPrimitive = string | number | boolean | null;

export const toString = (data: JSONValue): string => withIndent("", data);

export const withIndent = (indent: string, value: JSONValue): string => {
  return isObject(value)
    ? objectToString(indent, value)
    : Array.isArray(value)
      ? arrayToString(indent, value)
      : primitiveToString(indent, value);
};

const isObject = (value: JSONValue): value is JSONObject =>
  value !== null && typeof value === "object";

const objectToString = (indent: string, object: JSONObject): string => {
  const fields = Object.entries(object).filter(([, value]) => value !== null);
  if (fields.length === 1) {
    return withIndent(indent, fields[0][1]);
  }

  const keyValues = fields.map(
    ([key, value]) => `${key} ${withIndent(` ${indent}`, value)}`
  );

  return arrayToString(indent, keyValues);
};

const arrayToString = (indent: string, array: JSONArray): string => {
  return array.map(value => `${withIndent(indent, value)}`).join("");
};

const primitiveToString1 = (indent: string, primitive: JSONPrimitive): string =>
  typeof primitive === "string"
    ? wrap(primitive, { indent, width: MAX_WIDTH })
    : JSON.stringify(primitive);

primitiveToString1;

const primitiveToString = (indent: string, primitive: JSONPrimitive): string =>
  typeof primitive === "string"
    ? `\n${indent}${primitive}`.trimRight()
    : JSON.stringify(primitive);

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
            stop: [1, 2, 3, 4, 5, 6, 7, 8, 1, 2, 3, 4, 5, 6, 7, 8],
            stop2: [1, 2, 3, 4]
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
