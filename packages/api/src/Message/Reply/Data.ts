import _ from "lodash";
import wrap from "word-wrap";

const MAX_WIDTH = 23;

export type JSONValue = JSONObject | JSONArray | JSONPrimitive;

export interface JSONObject {
  [key: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}
export type JSONPrimitive = string | number | boolean | null;

export const toString = (data: JSONValue): string =>
  withIndent("", data)
    .replace("\n", "")
    .split("\n")
    .map(value => {
      const trimmed = value.trimRight();
      if (trimmed.length < MAX_WIDTH) {
        return trimmed;
      }

      const spaces = value.match(/\s+/) || "";
      if (!spaces) {
        return trimmed;
      }

      const indent = spaces[0];
      return wrap(trimmed.trimLeft(), { indent, width: MAX_WIDTH });
    })
    .join("\n");

export const withIndent = (indent: string, value: JSONValue): string =>
  Array.isArray(value)
    ? arrayToString(indent, value)
    : isObject(value)
      ? objectToString(indent, value)
      : primitiveToString(indent, value);

const isObject = (value: JSONValue): value is JSONObject =>
  value !== null && typeof value === "object";

const objectToString = (indent: string, object: JSONObject): string => {
  const nonNulls = Object.entries(object).filter(([, value]) => value !== null);
  return nonNulls.length === 1
    ? withIndent(indent, nonNulls[0][1])
    : arrayToString(
        indent,
        nonNulls.map(([key, value]) => {
          const valueAsString = withIndent(` ${indent}`, value);
          if (valueAsString.replace(/ /g, "") === "") {
            return "";
          }

          return formatLines(indent, `${key}${valueAsString}`);
        })
      );
};

const arrayToString = (indent: string, array: JSONArray): string =>
  formatLines(
    indent,
    array
      .filter(value => value !== "")
      .map(value => {
        const valueAsString = withIndent(indent, value);
        return isObject(value) && !valueAsString.includes("\n")
          ? primitiveToString(indent, valueAsString)
          : valueAsString;
      })
      .join(""),
    " "
  );

const formatLines = (
  indent: string,
  asMultipleLines: string,
  separator: string = ""
): string => {
  const asSingleLine = asMultipleLines
    .split(`\n${indent}`)
    .filter(line => line !== "")
    .join(separator);

  return asSingleLine.length <= MAX_WIDTH ? asSingleLine : asMultipleLines;
};

const primitiveToString = (indent: string, primitive: JSONPrimitive): string =>
  `\n${indent}${primitive}`;
