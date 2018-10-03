import wrap from "word-wrap";

// This is approximately how wide SMS messages can be on an iPhone 7
const MAX_WIDTH = 23;

export type JSONValue = JSONObject | JSONArray | JSONPrimitive;

export interface JSONObject {
  [key: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}
export type JSONPrimitive = string | number | boolean | null;

/*
  Raw GraphQL results or other large JSON objects sent over SMS would be
  unreadable and too large. This pretty-prints JSON using an aggressively-
  compacting set of rules...
*/
export const fromJSONValue = (value: JSONValue): string =>
  toString("", value)
    .replace("\n", "")
    .split("\n")

    // Wrap content which goes past `MAX_WIDTH` to new lines
    .map(line => {
      const trimmedRightOnly = line.trimRight();
      const trimmed = trimmedRightOnly.trimLeft();
      if (trimmed.length < MAX_WIDTH && trimmed !== trimmedRightOnly) {
        return trimmedRightOnly;
      }

      /*
        Grab the spaces before the line contents to use as the indent for 
        wrapping new lines...
        
        <space><space><space>Content which is too long

        ...becomes...

        <space><space><space>Content
        <space><space><space>which is
        <space><space><space>too long
      */
      const spaces = trimmedRightOnly.match(/\s+/);
      const indent =
        spaces && spaces[0] && trimmedRightOnly.indexOf(spaces[0]) === 0
          ? ` ${spaces[0]}`
          : " ";

      // Start the first line one extra space to the left
      return wrap(trimmed, { indent, width: MAX_WIDTH }).replace(" ", "");
    })
    .join("\n");

export const toString = (indent: string, value: JSONValue): string =>
  Array.isArray(value)
    ? arrayToString(indent, value)
    : isObject(value)
      ? objectToString(indent, value)
      : primitiveToString(indent, value);

const isObject = (value: JSONValue): value is JSONObject =>
  value !== null && typeof value === "object";

const objectToString = (indent: string, object: JSONObject): string => {
  // Null fields are dropped from the output
  const nonNulls = Object.entries(object).filter(([, value]) => value !== null);

  /*
    If we have an object with one field, replace the object with its value...
    { x: { y: { z: { true } }, a: false } ...becomes... "x true a false"
  */
  return nonNulls.length === 1
    ? toString(indent, nonNulls[0][1])
    : /*
        Print the object the same way we would an array where the items are
        key/value strings

        `{ x: true, y: false }` is printed like `["x\ntrue", "y\nfalse"]`
      */
      arrayToString(
        indent,
        nonNulls.map(([key, value]) => {
          const nextIndent = ` ${indent}`;
          const valueAsString = toString(nextIndent, value);

          // Drop empty values
          if (valueAsString.replace(/ /g, "") === "") return "";

          // Always put the value on the next line so it's formatted correctly
          const spacing = valueAsString.includes("\n") ? "" : `\n${nextIndent}`;
          return formatLines(indent, `${key}:${spacing}${valueAsString}`);
        })
      );
};

const arrayToString = (indent: string, array: JSONArray): string =>
  formatLines(
    indent,
    array
      .filter(value => value !== "")
      .map(value => {
        const valueAsString = toString(indent, value);
        return !isObject(value) && !valueAsString.includes("\n")
          ? primitiveToString(indent, valueAsString)
          : valueAsString;
      })
      .join(" ")
  );

/*
  This helps ensure we don't waste space when a string like...
  `
    key1 value1
    key2 value2
  `
  ...could fit on one line "key1 value1 key2 value2" instead
*/
const formatLines = (indent: string, asMultipleLines: string): string => {
  const asSingleLine = asMultipleLines
    .split(`\n${indent}`)
    .filter(line => line !== "")
    .join("");

  return `${indent}${asSingleLine}`.length <= MAX_WIDTH
    ? asSingleLine
    : asMultipleLines;
};

const primitiveToString = (indent: string, primitive: JSONPrimitive): string =>
  `\n${indent}${primitive}`;
