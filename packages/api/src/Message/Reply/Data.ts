export const toString = (
  data: any,
  indent: string = "",
  addIndent: boolean = false
): string =>
  data && typeof data === "object"
    ? objectToString(data, `${indent}${addIndent ? " " : ""}`)
    : typeof data !== "string"
      ? JSON.stringify(data)
      : data;

const objectToString = (
  object: any[] | { [key: string]: any },
  indent: string
): string => {
  if (Array.isArray(object)) {
    const values = object.map(value => toString(value, indent, true));
    const asLine = values.join(" ");

    if (isEmpty(asLine)) {
      return "";
    }

    return isTooLong(indent, asLine)
      ? values.map(value => `${value}`).join(`\n${indent}`)
      : asLine;
  }

  const nonNulls = Object.entries(object).filter(([, value]) => value !== null);
  if (nonNulls.length === 1) {
    const [[, childValue]] = nonNulls;
    return toString(childValue, indent);
  }

  const fields: string[] = nonNulls
    .map(([key, value]) => {
      const contents = toString(value, indent);
      if (isEmpty(contents)) {
        return "";
      }

      if (key === "narratives") {
        console.log({ key, value, contents });
      }

      const spacing = isTooLong(indent, key, " ", contents)
        ? `\n${indent} `
        : " ";

      return `${key}${spacing}${contents}`;
    })
    .filter(value => !isEmpty(value));

  return objectToString(fields, indent);
};

const isTooLong = (...strings: string[]): boolean =>
  strings.join("").length > 23;

const isEmpty = (string: string): boolean =>
  string.replace(/\n/g, "").trim() === "";
