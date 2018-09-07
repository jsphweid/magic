export const toString = (
  data: any,
  indent: string = "",
  addIndent: boolean = false
): string =>
  isObject(data)
    ? objectToString(data, `${indent}${addIndent ? " " : ""}`)
    : typeof data !== "string"
      ? JSON.stringify(data)
      : data;

const objectToString = (
  object: any[] | { [key: string]: any },
  indent: string
): string => {
  if (Array.isArray(object)) {
    const values = object.map(value => {
      return isObject(value)
        ? objectToString(value, indent)
        : toString(value, indent, true);
    });

    const asLine = values.join(" ");
    if (isEmpty(asLine)) {
      return "";
    }

    return !isTooLong(indent, asLine)
      ? asLine
      : values
          .map(value => `${!isIndented(indent, value) ? indent : ""}${value}`)
          .join(`\n`);
  }

  const nonNulls = Object.entries(object).filter(([, value]) => value !== null);
  if (nonNulls.length === 1) {
    const [[, childValue]] = nonNulls;
    return toString(childValue, indent);
  }

  const fields: string[] = nonNulls
    .map(([key, value]) => {
      const contents = toString(value, indent, true);
      if (isEmpty(contents)) {
        return "";
      }

      const spacing = isTooLong(indent, key, " ", contents) ? "\n" : " ";
      return `${key}${spacing}${contents}`;
    })
    .filter(value => !isEmpty(value));

  return objectToString(fields, indent);
};

const isObject = (value: any): boolean => value && typeof value === "object";

const isTooLong = (...strings: string[]): boolean =>
  strings.join("").length > 23;

const isIndented = (indent: string, string: string): boolean =>
  string.indexOf(indent) === 0;

const isEmpty = (string: string): boolean =>
  string.replace(/\n/g, "").trim() === "";

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
            name: "magic",
            score: "POSITIVE_HIGH"
          }
        }
      ]
    }
  }
});

console.log(x);
console.log(JSON.stringify(x));
